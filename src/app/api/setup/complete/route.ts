import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import crypto, { randomUUID } from 'crypto';
import { configService } from '@/lib/config-service';
import {
  InstallationCompleteSchema,
  InstallationCompletePayload,
  formatValidationErrors,
} from '@/lib/schemas/install.schema';

// Encryption key - same as config-service
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-development-key-change-in-production';

function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32),
    iv
  );
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * POST /api/setup/complete
 * 
 * Endpoint atómico que finaliza a instalação do Acrobaticz com DEBUG detalhado
 * Correções implementadas:
 * 1. Adicionar id: randomUUID() em TODOS os systemSetting.upsert().create
 * 2. Verificar isEncrypted coerência
 * 3. Logs [INSTALL-DEBUG] em cada passo crítico
 */
export async function POST(request: NextRequest) {
  const prisma = new PrismaClient();
  const DEBUG = process.env.NODE_ENV === 'development';

  try {
    // ===== STEP 1: Parsing do request body =====
    if (DEBUG) console.log('[INSTALL-DEBUG] ===== STEP 1: Parsing JSON =====');
    let payload: unknown;
    try {
      payload = await request.json();
      if (DEBUG) console.log('[INSTALL-DEBUG] JSON parsed successfully');
    } catch (error) {
      console.error('[INSTALL-ERROR] JSON parse failed:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // ===== STEP 2: Validação com Zod Schema =====
    if (DEBUG) console.log('[INSTALL-DEBUG] ===== STEP 2: Validação Zod =====');
    const validationResult = InstallationCompleteSchema.safeParse(payload);

    if (!validationResult.success) {
      const formattedErrors = formatValidationErrors(validationResult.error.issues);
      console.error('[INSTALL-ERROR] Schema validation failed:', JSON.stringify(formattedErrors, null, 2));
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: formattedErrors,
        },
        { status: 422 }
      );
    }

    const data: InstallationCompletePayload = validationResult.data;
    if (DEBUG) console.log('[INSTALL-DEBUG] Payload validado com sucesso');

    // ===== STEP 3: Verificação de re-instalação (Segurança) =====
    if (DEBUG) console.log('[INSTALL-DEBUG] ===== STEP 3: Verificação re-instalação =====');
    const isAlreadyInstalled = await configService.isInstalled();
    if (DEBUG) console.log('[INSTALL-DEBUG] isAlreadyInstalled:', isAlreadyInstalled);
    
    if (isAlreadyInstalled) {
      console.warn('[INSTALL-WARNING] Sistema já foi instalado anteriormente');
      return NextResponse.json(
        {
          success: false,
          error: 'Installation already completed',
          message: 'Sistema já foi instalado. Acesso negado.',
        },
        { status: 403 }
      );
    }

    // ===== STEP 4: Hash da password do admin =====
    if (DEBUG) console.log('[INSTALL-DEBUG] ===== STEP 4: Hash password =====');
    let hashedPassword: string;
    try {
      const saltRounds = 10;
      if (DEBUG) console.log('[INSTALL-DEBUG] A fazer hash com', saltRounds, 'rounds');
      hashedPassword = await bcryptjs.hash(data.adminPassword, saltRounds);
      if (DEBUG) console.log('[INSTALL-DEBUG] Hash criado com sucesso');
    } catch (error) {
      console.error('[INSTALL-ERROR] bcryptjs.hash falhou:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Encryption error',
          message: 'Erro ao encriptar password do administrador',
        },
        { status: 500 }
      );
    }

    // ===== STEP 5: Geração de username do admin =====
    if (DEBUG) console.log('[INSTALL-DEBUG] ===== STEP 5: Geração username =====');
    const normalizedUsername = data.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '.')
      .replace(/\.+/g, '.')
      .replace(/^\.|\.$/g, '');

    const baseUsername = normalizedUsername || 'admin';
    let finalUsername = baseUsername;
    let usernameCounter = 1;

    if (DEBUG) console.log('[INSTALL-DEBUG] baseUsername:', baseUsername);

    const existingUserPattern = new RegExp(`^${baseUsername}(\\d*)$`);
    
    if (DEBUG) console.log('[INSTALL-DEBUG] A procurar por users existentes');
    const existingUsers = await prisma.user.findMany({
      where: {
        username: {
          startsWith: baseUsername,
        },
      },
      select: { username: true },
    });

    if (DEBUG) console.log('[INSTALL-DEBUG] Encontrados', existingUsers.length, 'users existentes');

    if (existingUsers.length > 0) {
      const highestCounter = existingUsers
        .map((u: { username: string }) => {
          const match = u.username.match(existingUserPattern);
          return match ? parseInt(match[1] || '1', 10) : 0;
        })
        .reduce((max: number, current: number) => Math.max(max, current), 1);

      finalUsername = `${baseUsername}${highestCounter + 1}`;
      if (DEBUG) console.log('[INSTALL-DEBUG] Username ajustado para:', finalUsername);
    } else {
      if (DEBUG) console.log('[INSTALL-DEBUG] Username final:', finalUsername);
    }

    // ===== STEP 6: Transação Atómica Prisma =====
    if (DEBUG) console.log('[INSTALL-DEBUG] ===== STEP 6: Transação Prisma =====');
    if (DEBUG) console.log('[INSTALL-DEBUG] A iniciar $transaction com múltiplos writes');
    
    const transactionResult = await prisma.$transaction(
      async (txPrisma: any) => {
        try {
          if (DEBUG) console.log('[INSTALL-DEBUG] 6a: Criar utilizador admin');
          const adminUser = await txPrisma.user.create({
            data: {
              id: randomUUID(),
              name: `${data.companyName} Admin`,
              username: finalUsername,
              password: hashedPassword,
              role: 'Admin',
              isActive: true,
              contactEmail: data.adminEmail,
              updatedAt: new Date(),
            },
          });
          if (DEBUG) console.log('[INSTALL-DEBUG] 6a: User criado com ID:', adminUser.id);

          if (DEBUG) console.log('[INSTALL-DEBUG] 6b: Gravar configurações gerais');
          await txPrisma.systemSetting.upsert({
            where: { category_key: { category: 'General', key: 'DOMAIN' } },
            create: {
              id: randomUUID(),
              category: 'General',
              key: 'DOMAIN',
              value: data.domain,
              isEncrypted: false,
              description: 'Domínio da aplicação',
              isEditable: true,
              updatedAt: new Date(),
            },
            update: {
              value: data.domain,
              updatedAt: new Date(),
            },
          });

          await txPrisma.systemSetting.upsert({
            where: { category_key: { category: 'General', key: 'COMPANY_NAME' } },
            create: {
              id: randomUUID(),
              category: 'General',
              key: 'COMPANY_NAME',
              value: data.companyName,
              isEncrypted: false,
              description: 'Nome da empresa',
              isEditable: true,
              updatedAt: new Date(),
            },
            update: {
              value: data.companyName,
              updatedAt: new Date(),
            },
          });
          if (DEBUG) console.log('[INSTALL-DEBUG] 6b: Configurações gerais gravadas');

          if (DEBUG) console.log('[INSTALL-DEBUG] 6c: Gravar JWT Secret');
          await txPrisma.systemSetting.upsert({
            where: { category_key: { category: 'Auth', key: 'JWT_SECRET' } },
            create: {
              id: randomUUID(),
              category: 'Auth',
              key: 'JWT_SECRET',
              value: null,
              encryptedValue: data.jwtSecret,
              isEncrypted: true,
              description: 'Chave para assinatura de tokens JWT',
              isEditable: false,
              updatedAt: new Date(),
            },
            update: {
              value: null,
              encryptedValue: data.jwtSecret,
              isEncrypted: true,
              updatedAt: new Date(),
            },
          });
          if (DEBUG) console.log('[INSTALL-DEBUG] 6c: JWT Secret gravado');

          if (data.deeplApiKey) {
            if (DEBUG) console.log('[INSTALL-DEBUG] 6d: Gravar DeepL API Key');
            await txPrisma.systemSetting.upsert({
              where: { category_key: { category: 'Integration', key: 'DEEPL_API_KEY' } },
              create: {
                id: randomUUID(),
                category: 'Integration',
                key: 'DEEPL_API_KEY',
                value: null,
                encryptedValue: data.deeplApiKey,
                isEncrypted: true,
                description: 'API Key para serviço de tradução DeepL',
                isEditable: true,
                updatedAt: new Date(),
              },
              update: {
                value: null,
                encryptedValue: data.deeplApiKey,
                isEncrypted: true,
                updatedAt: new Date(),
              },
            });
          }

          if (data.geminiApiKeys && data.geminiApiKeys.length > 0) {
            if (DEBUG) console.log('[INSTALL-DEBUG] 6d: Gravar Gemini API Keys');
            const geminiKeysJson = JSON.stringify(data.geminiApiKeys);
            const encryptedGeminiKeys = encrypt(geminiKeysJson);
            await txPrisma.systemSetting.upsert({
              where: { category_key: { category: 'Integration', key: 'GEMINI_API_KEYS' } },
              create: {
                id: randomUUID(),
                category: 'Integration',
                key: 'GEMINI_API_KEYS',
                value: null,
                encryptedValue: encryptedGeminiKeys,
                isEncrypted: true,
                description: 'JSON array com múltiplas API Keys do Google Gemini para criação de equipamentos com IA',
                isEditable: true,
                updatedAt: new Date(),
              },
              update: {
                value: null,
                encryptedValue: encryptedGeminiKeys,
                isEncrypted: true,
                updatedAt: new Date(),
              },
            });
          }

          if (DEBUG) console.log('[INSTALL-DEBUG] 6e: Gravar configurações de branding');
          if (data.logoUrl) {
            await txPrisma.systemSetting.upsert({
              where: { category_key: { category: 'Branding', key: 'LOGO_URL' } },
              create: {
                id: randomUUID(),
                category: 'Branding',
                key: 'LOGO_URL',
                value: data.logoUrl,
                isEncrypted: false,
                description: 'URL do logo da empresa',
                isEditable: true,
                updatedAt: new Date(),
              },
              update: {
                value: data.logoUrl,
                updatedAt: new Date(),
              },
            });
          }

          if (data.primaryColor) {
            await txPrisma.systemSetting.upsert({
              where: { category_key: { category: 'Branding', key: 'PRIMARY_COLOR' } },
              create: {
                id: randomUUID(),
                category: 'Branding',
                key: 'PRIMARY_COLOR',
                value: data.primaryColor,
                isEncrypted: false,
                description: 'Cor primária para interface',
                isEditable: true,
                updatedAt: new Date(),
              },
              update: {
                value: data.primaryColor,
                updatedAt: new Date(),
              },
            });
          }

          if (data.secondaryColor) {
            await txPrisma.systemSetting.upsert({
              where: { category_key: { category: 'Branding', key: 'SECONDARY_COLOR' } },
              create: {
                id: randomUUID(),
                category: 'Branding',
                key: 'SECONDARY_COLOR',
                value: data.secondaryColor,
                isEncrypted: false,
                description: 'Cor secundária para interface',
                isEditable: true,
                updatedAt: new Date(),
              },
              update: {
                value: data.secondaryColor,
                updatedAt: new Date(),
              },
            });
          }

          if (data.accentColor) {
            await txPrisma.systemSetting.upsert({
              where: { category_key: { category: 'Branding', key: 'ACCENT_COLOR' } },
              create: {
                id: randomUUID(),
                category: 'Branding',
                key: 'ACCENT_COLOR',
                value: data.accentColor,
                isEncrypted: false,
                description: 'Cor de destaque para interface',
                isEditable: true,
                updatedAt: new Date(),
              },
              update: {
                value: data.accentColor,
                updatedAt: new Date(),
              },
            });
          }
          if (DEBUG) console.log('[INSTALL-DEBUG] 6e: Branding gravado');

          if (data.minioEndpoint && data.minioAccessKey && data.minioSecretKey && data.minioBucket) {
            if (DEBUG) console.log('[INSTALL-DEBUG] 6f: Gravar configurações MinIO');
            await txPrisma.systemSetting.upsert({
              where: { category_key: { category: 'Storage', key: 'MINIO_ENDPOINT' } },
              create: {
                id: randomUUID(),
                category: 'Storage',
                key: 'MINIO_ENDPOINT',
                value: data.minioEndpoint,
                isEncrypted: false,
                description: 'URL do servidor MinIO/S3',
                isEditable: true,
                updatedAt: new Date(),
              },
              update: {
                value: data.minioEndpoint,
                updatedAt: new Date(),
              },
            });

            await txPrisma.systemSetting.upsert({
              where: { category_key: { category: 'Storage', key: 'MINIO_ACCESS_KEY' } },
              create: {
                id: randomUUID(),
                category: 'Storage',
                key: 'MINIO_ACCESS_KEY',
                value: null,
                encryptedValue: data.minioAccessKey,
                isEncrypted: true,
                description: 'Access Key MinIO',
                isEditable: true,
                updatedAt: new Date(),
              },
              update: {
                value: null,
                encryptedValue: data.minioAccessKey,
                updatedAt: new Date(),
              },
            });

            await txPrisma.systemSetting.upsert({
              where: { category_key: { category: 'Storage', key: 'MINIO_SECRET_KEY' } },
              create: {
                id: randomUUID(),
                category: 'Storage',
                key: 'MINIO_SECRET_KEY',
                value: null,
                encryptedValue: data.minioSecretKey,
                isEncrypted: true,
                description: 'Secret Key MinIO',
                isEditable: true,
                updatedAt: new Date(),
              },
              update: {
                value: null,
                encryptedValue: data.minioSecretKey,
                updatedAt: new Date(),
              },
            });

            await txPrisma.systemSetting.upsert({
              where: { category_key: { category: 'Storage', key: 'MINIO_BUCKET' } },
              create: {
                id: randomUUID(),
                category: 'Storage',
                key: 'MINIO_BUCKET',
                value: data.minioBucket,
                isEncrypted: false,
                description: 'Bucket MinIO para armazenamento de ficheiros',
                isEditable: true,
                updatedAt: new Date(),
              },
              update: {
                value: data.minioBucket,
                updatedAt: new Date(),
              },
            });
            if (DEBUG) console.log('[INSTALL-DEBUG] 6f: MinIO configurado');
          } else {
            if (DEBUG) console.log('[INSTALL-DEBUG] 6f: MinIO não configurado');
          }

          if (DEBUG) console.log('[INSTALL-DEBUG] 6g: Marcar INSTALLATION_COMPLETE');
          await txPrisma.systemSetting.upsert({
            where: { category_key: { category: 'General', key: 'INSTALLATION_COMPLETE' } },
            create: {
              id: randomUUID(),
              category: 'General',
              key: 'INSTALLATION_COMPLETE',
              value: 'true',
              isEncrypted: false,
              description: 'Flag indicando que a instalação foi completada',
              isEditable: false,
              updatedAt: new Date(),
            },
            update: {
              value: 'true',
              updatedAt: new Date(),
            },
          });
          if (DEBUG) console.log('[INSTALL-DEBUG] 6g: INSTALLATION_COMPLETE definido como true');

          return { adminUser };
        } catch (txError) {
          if (DEBUG) {
            console.error('[INSTALL-ERROR] Erro dentro da transação:', {
              name: txError instanceof Error ? txError.name : 'Unknown',
              message: txError instanceof Error ? txError.message : String(txError),
              stack: txError instanceof Error ? txError.stack : undefined,
            });
          }
          throw txError;
        }
      }
    );
    
    if (DEBUG) console.log('[INSTALL-DEBUG] Transação completada com sucesso');
    if (DEBUG) console.log('[INSTALL-DEBUG] AdminUser ID:', transactionResult.adminUser.id);

    // ===== STEP 7: Invalidar cache de configService =====
    if (DEBUG) console.log('[INSTALL-DEBUG] ===== STEP 7: Invalidar cache =====');
    await configService.loadConfig(true);
    if (DEBUG) console.log('[INSTALL-DEBUG] Cache invalidado');

    // ===== STEP 8: Construir resposta =====
    if (DEBUG) console.log('[INSTALL-DEBUG] ===== STEP 8: Construir resposta =====');
    const response = NextResponse.json(
      {
        success: true,
        message: 'Instalação completada com sucesso',
        data: {
          adminUsername: transactionResult.adminUser.username,
          adminEmail: data.adminEmail,
          domain: data.domain,
          companyName: data.companyName,
          installationCompletedAt: new Date().toISOString(),
        },
        redirectUrl: '/dashboard',
      },
      { status: 200 }
    );

    // ===== STEP 9: Cookie =====
    if (DEBUG) console.log('[INSTALL-DEBUG] ===== STEP 9: Cookie =====');
    response.cookies.set('app_installed', 'true', {
      path: '/',
      httpOnly: true,
      maxAge: 315360000,
      sameSite: 'lax',
    });
    if (DEBUG) console.log('[INSTALL-DEBUG] ===== INSTALAÇÃO COMPLETA =====');

    return response;
  } catch (error) {
    console.error('[INSTALL-ERROR] ===== ERRO NA INSTALAÇÃO =====');
    console.error('[INSTALL-ERROR] Erro completo:', JSON.stringify({
      timestamp: new Date().toISOString(),
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    }, null, 2));

    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown error during installation completion';

    return NextResponse.json(
      {
        success: false,
        error: 'Installation failed',
        message: 'Erro ao completar instalação. Por favor contacte suporte.',
        ...(typeof process !== 'undefined' && process.env.NODE_ENV === 'development' && {
          details: errorMessage,
          timestamp: new Date().toISOString(),
          errorType: error instanceof Error ? error.constructor.name : typeof error,
        }),
      },
      { status: 500 }
    );
  } finally {
    if (DEBUG) console.log('[INSTALL-DEBUG] ===== FINALLY: Desconectar =====');
    await prisma.$disconnect();
    if (DEBUG) console.log('[INSTALL-DEBUG] Desconectado');
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': typeof process !== 'undefined' && process.env.NEXT_PUBLIC_APP_URL ? process.env.NEXT_PUBLIC_APP_URL : '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
