import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/setup/test-storage
 *
 * Endpoint para testar conectividade e credenciais MinIO/S3
 *
 * Request body:
 * {
 *   minioEndpoint: string    // ex: "minio:9000"
 *   minioAccessKey: string   // username
 *   minioSecretKey: string   // password
 *   minioBucket: string      // bucket name
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   message?: string         // Human-friendly message
 *   error?: string           // Error details
 *   latency?: number         // Response time in ms
 *   bucketExists?: boolean   // If bucket was found
 * }
 *
 * Implementation: Usa AWS SDK v3 para S3 (compatible com MinIO)
 */

interface TestStorageRequest {
  minioEndpoint: string;
  minioAccessKey: string;
  minioSecretKey: string;
  minioBucket: string;
}

interface TestStorageResponse {
  success: boolean;
  message?: string;
  error?: string;
  latency?: number;
  bucketExists?: boolean;
}

async function testMinIOConnection(
  endpoint: string,
  accessKey: string,
  secretKey: string,
  bucket: string
): Promise<TestStorageResponse> {
  const startTime = Date.now();

  try {
    // Dinâmico import para evitar erros se @aws-sdk/client-s3 não está instalado
    let S3Client: any;
    let ListBucketsCommand: any;

    try {
      const awsSdk = await import('@aws-sdk/client-s3');
      S3Client = awsSdk.S3Client;
      ListBucketsCommand = awsSdk.ListBucketsCommand;
    } catch (importError) {
      // Se AWS SDK não está instalado, tentar conexão simples via HTTP
      return testMinIOHTTP(endpoint, accessKey, secretKey, bucket);
    }

    // Configurar client S3 com endpoint MinIO
    const s3Client = new S3Client({
      region: 'us-east-1',
      endpoint: `http://${endpoint}`, // MinIO usa HTTP (ou HTTPS se configurado)
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      // Forçar path-style URLs (compatível com MinIO)
      forcePathStyle: true,
    });

    // Testar comando básico: ListBuckets
    const command = new ListBucketsCommand({});
    const response = await Promise.race([
      s3Client.send(command),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout (5s)')), 5000)
      ),
    ]) as any;

    const latency = Date.now() - startTime;

    // Verificar se bucket existe na lista
    const bucketExists = response.Buckets?.some(
      (b: any) => b.Name === bucket
    ) || false;

    if (!bucketExists) {
      return {
        success: false,
        error: `Bucket "${bucket}" not found. Create it before proceeding.`,
        latency,
        bucketExists: false,
      };
    }

    await s3Client.destroy();

    return {
      success: true,
      message: `MinIO is accessible. Bucket "${bucket}" found.`,
      latency,
      bucketExists: true,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Classificar erro e fornecer mensagem amigável
    let friendlyError = errorMessage;

    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('Connection refused')) {
      friendlyError = `Cannot connect to MinIO at ${endpoint}. Check if it's running and reachable.`;
    } else if (errorMessage.includes('InvalidAccessKeyId') || errorMessage.includes('Access Denied')) {
      friendlyError = 'Invalid access key or secret key. Check your MinIO credentials.';
    } else if (errorMessage.includes('timeout')) {
      friendlyError = `MinIO connection timeout (5s). Check your endpoint: ${endpoint}`;
    } else if (errorMessage.includes('getaddrinfo ENOTFOUND')) {
      friendlyError = `Cannot resolve MinIO endpoint: ${endpoint}. Check the hostname.`;
    }

    return {
      success: false,
      error: friendlyError,
      latency,
    };
  }
}

/**
 * Fallback: Teste simples via HTTP request (caso AWS SDK não esteja instalado)
 * Apenas verifica se o endpoint responde
 */
async function testMinIOHTTP(
  endpoint: string,
  accessKey: string,
  secretKey: string,
  bucket: string
): Promise<TestStorageResponse> {
  const startTime = Date.now();

  try {
    // Construir URL base
    const baseUrl = endpoint.startsWith('http') ? endpoint : `http://${endpoint}`;

    // Endpoint MinIO simples: GET /
    const response = await Promise.race([
      fetch(`${baseUrl}/`, {
        method: 'GET',
        headers: {
          'Authorization': `AWS ${accessKey}:${secretKey}`,
        },
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      ),
    ]) as any;

    const latency = Date.now() - startTime;

    // MinIO responde com 403 se credenciais forem inválidas
    // ou 200/404 se for acessível
    if (response.status === 403) {
      return {
        success: false,
        error: 'Invalid MinIO credentials (Access Denied). Check access key and secret key.',
        latency,
      };
    }

    // Se conseguiu conectar (2xx ou 4xx é ok, desde que não seja 403)
    if (response.ok || response.status === 404) {
      return {
        success: true,
        message: `MinIO endpoint is accessible at ${baseUrl}. (Note: Full bucket validation requires AWS SDK)`,
        latency,
      };
    }

    return {
      success: false,
      error: `MinIO responded with status ${response.status}. Check your configuration.`,
      latency,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    let friendlyError = errorMessage;
    if (errorMessage.includes('ECONNREFUSED')) {
      friendlyError = `Cannot connect to MinIO at ${endpoint}. Make sure it's running.`;
    } else if (errorMessage.includes('timeout')) {
      friendlyError = `Connection to MinIO timed out. Check endpoint: ${endpoint}`;
    }

    return {
      success: false,
      error: friendlyError,
      latency,
    };
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<TestStorageResponse>> {
  try {
    const body: unknown = await request.json();

    // Validação básica do payload
    if (
      typeof body !== 'object' ||
      body === null ||
      !('minioEndpoint' in body) ||
      !('minioAccessKey' in body) ||
      !('minioSecretKey' in body) ||
      !('minioBucket' in body)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: minioEndpoint, minioAccessKey, minioSecretKey, minioBucket',
        },
        { status: 400 }
      );
    }

    const payload = body as TestStorageRequest;

    // Validações adicionais
    if (!payload.minioEndpoint || !payload.minioAccessKey || !payload.minioSecretKey || !payload.minioBucket) {
      return NextResponse.json(
        {
          success: false,
          error: 'All MinIO configuration fields are required and cannot be empty',
        },
        { status: 400 }
      );
    }

    // Testar conexão
    const result = await testMinIOConnection(
      payload.minioEndpoint,
      payload.minioAccessKey,
      payload.minioSecretKey,
      payload.minioBucket
    );

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    console.error('Storage test error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: `Storage test failed: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler para CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
