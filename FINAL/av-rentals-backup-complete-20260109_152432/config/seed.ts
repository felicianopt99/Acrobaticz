import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  try {
    // 1️⃣ Seed Categories (must be first due to foreign keys)
    console.log("📂 Seeding Categories...");
  await prisma.category.upsert({
    where: { id: "cmk1e0n230003tb4gtbayc9jd" },
    update: {},
    create: {
      id: "cmk1e0n230003tb4gtbayc9jd",
      name: "Lighting",
      description: null,
      icon: "Lightbulb",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T16:55:54.022Z"),
      updatedAt: new Date("2026-01-06T19:55:04.350Z"),
    },
  });

  await prisma.category.upsert({
    where: { id: "cmk1e0n260004tb4g37154d95" },
    update: {},
    create: {
      id: "cmk1e0n260004tb4g37154d95",
      name: "Audio and Sound",
      description: null,
      icon: "Speaker",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T16:55:54.025Z"),
      updatedAt: new Date("2026-01-06T19:55:43.764Z"),
    },
  });

  await prisma.category.upsert({
    where: { id: "cmk2u2ind000ccw5gwp8sjln3" },
    update: {},
    create: {
      id: "cmk2u2ind000ccw5gwp8sjln3",
      name: "Video",
      description: null,
      icon: "Projector",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T16:58:15.145Z"),
      updatedAt: new Date("2026-01-06T19:55:37.185Z"),
    },
  });

  await prisma.category.upsert({
    where: { id: "cmk2xt5s50023cw5g2242d74c" },
    update: {},
    create: {
      id: "cmk2xt5s50023cw5g2242d74c",
      name: "Power",
      description: null,
      icon: "Settings",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T18:42:57.030Z"),
      updatedAt: new Date("2026-01-06T19:55:16.876Z"),
    },
  });

  await prisma.category.upsert({
    where: { id: "cmk2yahn1002mcw5gvbcgkszj" },
    update: {},
    create: {
      id: "cmk2yahn1002mcw5gvbcgkszj",
      name: "Others",
      description: null,
      icon: "Layers",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T18:56:25.549Z"),
      updatedAt: new Date("2026-01-06T19:55:54.467Z"),
    },
  });

  await prisma.category.upsert({
    where: { id: "cmk2yg76g002xcw5gs5phwj4g" },
    update: {},
    create: {
      id: "cmk2yg76g002xcw5gs5phwj4g",
      name: "Staging and Structures",
      description: null,
      icon: "Cuboid",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T19:00:51.928Z"),
      updatedAt: new Date("2026-01-06T19:55:26.233Z"),
    },
  });
    console.log("✅ Categories seeded");

    // 2️⃣ Seed Subcategories (depends on Categories)
    console.log("📂 Seeding Subcategories...");
  await prisma.subcategory.upsert({
    where: { id: "cmk1e0n3f000mtb4g4wo3p1kw" },
    update: {},
    create: {
      id: "cmk1e0n3f000mtb4g4wo3p1kw",
      name: "Battery",
      parentId: "cmk1e0n230003tb4gtbayc9jd",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T16:55:54.028Z"),
      updatedAt: new Date("2026-01-06T16:55:54.028Z"),
    },
  });

  await prisma.subcategory.upsert({
    where: { id: "cmk1e0n5m001etb4gstw7s39f" },
    update: {},
    create: {
      id: "cmk1e0n5m001etb4gstw7s39f",
      name: "Battery Speakers",
      parentId: "cmk1e0n260004tb4g37154d95",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T16:55:54.032Z"),
      updatedAt: new Date("2026-01-06T16:55:54.032Z"),
    },
  });

  await prisma.subcategory.upsert({
    where: { id: "cmk1e0n44000stb4gyw8a3jx9" },
    update: {},
    create: {
      id: "cmk1e0n44000stb4gyw8a3jx9",
      name: "Decorative Lighting",
      parentId: "cmk1e0n230003tb4gtbayc9jd",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T16:55:54.035Z"),
      updatedAt: new Date("2026-01-06T16:55:54.035Z"),
    },
  });

  await prisma.subcategory.upsert({
    where: { id: "cmk1ra3xh000qtjeh69nb1iod" },
    update: {},
    create: {
      id: "cmk1ra3xh000qtjeh69nb1iod",
      name: "Effects",
      parentId: "cmk1e0n230003tb4gtbayc9jd",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T16:55:54.038Z"),
      updatedAt: new Date("2026-01-06T16:55:54.038Z"),
    },
  });

  await prisma.subcategory.upsert({
    where: { id: "cmk1e0n2w000etb4gowy0l9bi" },
    update: {},
    create: {
      id: "cmk1e0n2w000etb4gowy0l9bi",
      name: "LED Par",
      parentId: "cmk1e0n230003tb4gtbayc9jd",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T16:55:54.041Z"),
      updatedAt: new Date("2026-01-06T16:55:54.041Z"),
    },
  });

  await prisma.subcategory.upsert({
    where: { id: "cmk1e0n5v001itb4g5o2ie47u" },
    update: {},
    create: {
      id: "cmk1e0n5v001itb4g5o2ie47u",
      name: "Microphones",
      parentId: "cmk1e0n260004tb4g37154d95",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T16:55:54.044Z"),
      updatedAt: new Date("2026-01-06T16:55:54.044Z"),
    },
  });

  await prisma.subcategory.upsert({
    where: { id: "cmk1e0n2a0006tb4gfvum37v3" },
    update: {},
    create: {
      id: "cmk1e0n2a0006tb4gfvum37v3",
      name: "Moving Head",
      parentId: "cmk1e0n230003tb4gtbayc9jd",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T16:55:54.047Z"),
      updatedAt: new Date("2026-01-06T16:55:54.047Z"),
    },
  });

  await prisma.subcategory.upsert({
    where: { id: "cmk1e0n4j000ytb4gz5y21ntw" },
    update: {},
    create: {
      id: "cmk1e0n4j000ytb4gz5y21ntw",
      name: "Speakers",
      parentId: "cmk1e0n260004tb4g37154d95",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T16:55:54.050Z"),
      updatedAt: new Date("2026-01-06T16:55:54.050Z"),
    },
  });

  await prisma.subcategory.upsert({
    where: { id: "cmk2u2qjj000ecw5gonqu3cu9" },
    update: {},
    create: {
      id: "cmk2u2qjj000ecw5gonqu3cu9",
      name: "Projector",
      parentId: "cmk2u2ind000ccw5gwp8sjln3",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T16:58:25.376Z"),
      updatedAt: new Date("2026-01-06T16:58:25.376Z"),
    },
  });

  await prisma.subcategory.upsert({
    where: { id: "cmk2ubkmf000pcw5g90hz31lj" },
    update: {},
    create: {
      id: "cmk2ubkmf000pcw5g90hz31lj",
      name: "Stage & Touring Gear",
      parentId: "cmk1e0n260004tb4g37154d95",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T17:05:17.607Z"),
      updatedAt: new Date("2026-01-06T17:05:17.607Z"),
    },
  });

  await prisma.subcategory.upsert({
    where: { id: "cmk2wxsub001fcw5gcpkpmxpz" },
    update: {},
    create: {
      id: "cmk2wxsub001fcw5gcpkpmxpz",
      name: "Mixing Consoles",
      parentId: "cmk1e0n260004tb4g37154d95",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T18:18:33.914Z"),
      updatedAt: new Date("2026-01-06T18:18:33.914Z"),
    },
  });

  await prisma.subcategory.upsert({
    where: { id: "cmk2xpun6001ycw5gbbd6i2bz" },
    update: {},
    create: {
      id: "cmk2xpun6001ycw5gbbd6i2bz",
      name: "Follow Spots",
      parentId: "cmk1e0n230003tb4gtbayc9jd",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T18:40:22.626Z"),
      updatedAt: new Date("2026-01-06T18:40:22.626Z"),
    },
  });

  await prisma.subcategory.upsert({
    where: { id: "cmk2xxaci0025cw5gl37pa6cl" },
    update: {},
    create: {
      id: "cmk2xxaci0025cw5gl37pa6cl",
      name: "Cabling & Distribution",
      parentId: "cmk2xt5s50023cw5g2242d74c",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T18:46:09.571Z"),
      updatedAt: new Date("2026-01-06T18:46:09.571Z"),
    },
  });

  await prisma.subcategory.upsert({
    where: { id: "cmk2yav4d002ocw5g7jyebitz" },
    update: {},
    create: {
      id: "cmk2yav4d002ocw5g7jyebitz",
      name: "Fans and ventilation",
      parentId: "cmk2yahn1002mcw5gvbcgkszj",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T18:56:43.022Z"),
      updatedAt: new Date("2026-01-06T18:56:43.022Z"),
    },
  });

  await prisma.subcategory.upsert({
    where: { id: "cmk2yguod002zcw5gazl94gfi" },
    update: {},
    create: {
      id: "cmk2yguod002zcw5gazl94gfi",
      name: "Stage Platforms & Risers",
      parentId: "cmk1e0n230003tb4gtbayc9jd",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T19:01:22.381Z"),
      updatedAt: new Date("2026-01-06T19:01:22.381Z"),
    },
  });

  await prisma.subcategory.upsert({
    where: { id: "cmk2yn0840039cw5gavgf2wsn" },
    update: {},
    create: {
      id: "cmk2yn0840039cw5gavgf2wsn",
      name: "DJ Equipment",
      parentId: "cmk1e0n260004tb4g37154d95",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T19:06:09.508Z"),
      updatedAt: new Date("2026-01-06T19:06:09.508Z"),
    },
  });

  await prisma.subcategory.upsert({
    where: { id: "cmk2zfbje0047cw5gihy6kc4h" },
    update: {},
    create: {
      id: "cmk2zfbje0047cw5gihy6kc4h",
      name: "Lighting Control",
      parentId: "cmk1e0n230003tb4gtbayc9jd",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T19:28:10.538Z"),
      updatedAt: new Date("2026-01-06T19:28:10.538Z"),
    },
  });

  await prisma.subcategory.upsert({
    where: { id: "cmk2zm9g4004hcw5g0hmjrt3d" },
    update: {},
    create: {
      id: "cmk2zm9g4004hcw5g0hmjrt3d",
      name: "Cable Management & Safety",
      parentId: "cmk2yg76g002xcw5gs5phwj4g",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T19:33:34.420Z"),
      updatedAt: new Date("2026-01-06T19:33:34.420Z"),
    },
  });

  await prisma.subcategory.upsert({
    where: { id: "cmk2zsbnb004rcw5gpo2fybt8" },
    update: {},
    create: {
      id: "cmk2zsbnb004rcw5gpo2fybt8",
      name: "Audio Recorder and Player",
      parentId: "cmk1e0n260004tb4g37154d95",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T19:38:17.207Z"),
      updatedAt: new Date("2026-01-06T19:38:17.207Z"),
    },
  });

  await prisma.subcategory.upsert({
    where: { id: "cmk2zuebl004xcw5gs501q7p4" },
    update: {},
    create: {
      id: "cmk2zuebl004xcw5gs501q7p4",
      name: "Trussing and Support",
      parentId: "cmk2yg76g002xcw5gs5phwj4g",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T19:39:53.985Z"),
      updatedAt: new Date("2026-01-06T19:39:53.985Z"),
    },
  });

  await prisma.subcategory.upsert({
    where: { id: "cmk3062bl005fcw5g359snsxf" },
    update: {},
    create: {
      id: "cmk3062bl005fcw5g359snsxf",
      name: "Power Distribution",
      parentId: "cmk2xt5s50023cw5g2242d74c",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T19:48:58.305Z"),
      updatedAt: new Date("2026-01-06T19:48:58.305Z"),
    },
  });
    console.log("✅ Subcategories seeded");

    // 3️⃣ Seed Equipment Items (depends on Categories & Subcategories)
    console.log("📦 Seeding Equipment Items...");
  await prisma.equipmentitem.upsert({
    where: { id: "cmk1r2r5y000ftjehu7vmjvk4" },
    update: {},
    create: {
      id: "cmk1r2r5y000ftjehu7vmjvk4",
      name: "Ape Labs Neon Tube – Professional Wireless LED Tube",
      description: "The Ape Labs Neon Tube is the ultimate tool for creating sophisticated, modern lighting environments. Unlike traditional LED bars, this 100cm tube offers a 180° homogeneous glow with absolutely no visible \"pixel dots.\" It is a heavy-duty, battery-powered fixture designed for professionals who need high-impact visual effects with zero cables and zero hassle.",
      descriptionPt: "O tubo de néon da Ape Labs é a ferramenta ideal para criar ambientes de iluminação sofisticados e modernos. Ao contrário das barras de LED tradicionais, este tubo de 100 cm oferece um brilho homogéneo de 180° sem quaisquer \"pontos de pixel\" visíveis. Trata-se de uma luminária resistente, alimentada por bateria, concebida para profissionais que necessitam de efeitos visuais de grande impacto sem cabos e sem complicações.",
      categoryId: "cmk1e0n230003tb4gtbayc9jd",
      subcategoryId: "cmk1e0n3f000mtb4g4wo3p1kw",
      quantity: 6,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/seeding-images/equipment-1767653200216-vwbhw98b1.jpg",
      dailyRate: 25,
      type: "equipment",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T16:55:54.053Z"),
      updatedAt: new Date("2026-01-06T16:55:54.053Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk1e0n5r001gtb4gs0gw00ef" },
    update: {},
    create: {
      id: "cmk1e0n5r001gtb4gs0gw00ef",
      name: "Electro-Voice EVERSE 8 (White) – Ultra-Portable Battery Powered PA",
      description: "Ultimate \"no-stress\" speaker. Designed for total mobility, this sleek white unit is completely wireless, running on high-capacity internal battery. Perfect for rooftop events and mobile setups",
      descriptionPt: "O melhor altifalante \"sem stress\". Concebida para uma mobilidade total, esta elegante unidade branca é totalmente sem fios e funciona com uma bateria interna de elevada capacidade. Perfeito para eventos em telhados e configurações móveis",
      categoryId: "cmk1e0n260004tb4g37154d95",
      subcategoryId: "cmk1e0n5m001etb4gstw7s39f",
      quantity: 2,
      status: "good",
      location: "Warehouse B",
      imageUrl: "/seeding-images/equipment-1767653239198-3x1k21hxw.jpg",
      dailyRate: 100,
      type: "equipment",
      version: 2,
      createdBy: null,
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T16:55:54.057Z"),
      updatedAt: new Date("2026-01-06T20:11:53.238Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk1e0n2r000ctb4ghxbg3if0" },
    update: {},
    create: {
      id: "cmk1e0n2r000ctb4ghxbg3if0",
      name: "FOS ACL LINE 12",
      description: "ACL Pixel Control line bar, 12 led 30watt RGBW, 3 degrees beam angle, Linear Dimmer 0-100%, DMX modes 10/48/58 ch, 93 cm, 7.9kg",
      descriptionPt: "Barra de linha ACL Pixel Control, 12 leds RGBW de 30 watts, ângulo de feixe de 3 graus, regulador de intensidade linear 0-100%, modos DMX 10/48/58 ch, 93 cm, 7,9 kg",
      categoryId: "cmk1e0n230003tb4gtbayc9jd",
      subcategoryId: "cmk1e0n2a0006tb4gfvum37v3",
      quantity: 6,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/seeding-images/equipment-1767652774835-zhdybbmzk.jpg",
      dailyRate: 45,
      type: "equipment",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T16:55:54.060Z"),
      updatedAt: new Date("2026-01-06T16:55:54.060Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk1e0n3b000ktb4go104acfo" },
    update: {},
    create: {
      id: "cmk1e0n3b000ktb4go104acfo",
      name: "FOS F-7",
      description: "Professional super bright outdoor IP65 Strobe/washer, 48 leds 15watt RGBW, 35° optics for each led, field angle 120°, diecast barndoor, Four section pixel control (Horizontal LED groups), true powercon",
      descriptionPt: "Lâmpada estroboscópica/lavadora profissional super brilhante para exterior IP65, 48 leds RGBW de 15 watts, ótica de 35° para cada led, ângulo de campo de 120°, barndoor fundido, controlo de pixéis de quatro secções (grupos de LED horizontais), verdadeiro controlo de potência",
      categoryId: "cmk1e0n230003tb4gtbayc9jd",
      subcategoryId: "cmk1e0n2w000etb4gowy0l9bi",
      quantity: 4,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/seeding-images/equipment-1767652798760-z74ni74i6.jpg",
      dailyRate: 35,
      type: "equipment",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T16:55:54.063Z"),
      updatedAt: new Date("2026-01-06T16:55:54.063Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk1e0n3j000otb4gaiz45mya" },
    update: {},
    create: {
      id: "cmk1e0n3j000otb4gaiz45mya",
      name: "FOS Luminus PRO IP",
      description: "High quality professional battery operated led par, 6 led HEX RGBW+A+UV 12 watt, IP Rating: IP54 top/ IP20 bottom, 100% true wireless DMX up to 400m visible control distance, Rechargeable",
      descriptionPt: "Par de leds profissionais de alta qualidade operados por bateria, 6 leds HEX RGBW+A+UV 12 watts, Classificação IP: IP54 superior/ IP20 inferior, DMX sem fios 100% verdadeiro até 400m de distância de controlo visível, recarregável",
      categoryId: "cmk1e0n230003tb4gtbayc9jd",
      subcategoryId: "cmk1e0n3f000mtb4g4wo3p1kw",
      quantity: 8,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/seeding-images/equipment-1767652824077-s63nwhotv.jpg",
      dailyRate: 15,
      type: "equipment",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T16:55:54.067Z"),
      updatedAt: new Date("2026-01-06T16:55:54.067Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk1e0n30000gtb4g7rv7rb7x" },
    update: {},
    create: {
      id: "cmk1e0n30000gtb4g7rv7rb7x",
      name: "FOS PAR ZOOM ULTRA",
      description: "Professional Zoom Par, 19 leds x 15watt 4in1 RGBW color mixing, linear motorized zoom 10-60, 10 DMX Channels, 4 button led display, aluminum die cast housing, 0-100% linear dimmer, 6.5 kg",
      descriptionPt: "Zoom Par profissional, 19 leds x 15 watts, mistura de cores 4 em 1 RGBW, zoom linear motorizado 10-60, 10 canais DMX, ecrã de 4 botões LED, caixa em alumínio fundido, regulação linear 0-100%, 6,5 kg",
      categoryId: "cmk1e0n230003tb4gtbayc9jd",
      subcategoryId: "cmk1e0n2w000etb4gowy0l9bi",
      quantity: 8,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/seeding-images/equipment-1767652845020-tomq0vl0o.jpg",
      dailyRate: 35,
      type: "equipment",
      version: 2,
      createdBy: null,
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T16:55:54.071Z"),
      updatedAt: new Date("2026-01-06T17:00:05.546Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk1e0n35000itb4gv63dhi2w" },
    update: {},
    create: {
      id: "cmk1e0n35000itb4gv63dhi2w",
      name: "FOS Par 18x10WPRO IP65",
      description: "Weatherproof aluminium led par with IP connectors, Beam aperture: 30°, 18 RGBW 10w LEDs (4in1), Dimmer: 0-100% stop/strobe effect, aluminium 4kg, noiseless cooling system",
      descriptionPt: "Par de leds em alumínio à prova de intempéries com conectores IP, abertura de feixe: 30°, 18 LEDs RGBW 10w (4em1), Regulador de intensidade: 0-100% efeito de paragem/estroboscópico, alumínio 4kg, sistema de arrefecimento silencioso",
      categoryId: "cmk1e0n230003tb4gtbayc9jd",
      subcategoryId: "cmk1e0n2w000etb4gowy0l9bi",
      quantity: 8,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/seeding-images/equipment-1767652872896-dbwz5sx2h.jpg",
      dailyRate: 25,
      type: "equipment",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T16:55:54.074Z"),
      updatedAt: new Date("2026-01-06T16:55:54.074Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk1e0n2m000atb4g7a1gjcxs" },
    update: {},
    create: {
      id: "cmk1e0n2m000atb4g7a1gjcxs",
      name: "FOS Q19 Ultra",
      description: "High power Wash / Beam moving head, 19 RGBW 40w 4in1 LEDs, linear zoom 6-60°, full pixel control, round ring with dynamic patterns, color temperature adjustment, 24,30,112 DMX channels, theater",
      descriptionPt: "Cabeça móvel Wash / Beam de alta potência, 19 LEDs RGBW 40w 4in1, zoom linear 6-60°, controlo total de pixéis, anel redondo com padrões dinâmicos, ajuste da temperatura da cor, 24,30,112 canais DMX, teatro",
      categoryId: "cmk1e0n230003tb4gtbayc9jd",
      subcategoryId: "cmk1e0n2a0006tb4gfvum37v3",
      quantity: 4,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/seeding-images/equipment-1767652898711-7h5jdh312.jpg",
      dailyRate: 75,
      type: "equipment",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T16:55:54.077Z"),
      updatedAt: new Date("2026-01-06T16:55:54.077Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk1e0n4g000wtb4gj2yekt3o" },
    update: {},
    create: {
      id: "cmk1e0n4g000wtb4gj2yekt3o",
      name: "FOS Retro",
      description: "Retro background fixture, diameter 64cm, 750 watt halogen lamp driven by internal dimmer, 96pcs 3in1 RGB LEDs background lighting, 4/6/9 DMX channels, Aluminum alloy housing, LCD menu",
      descriptionPt: "Luminária de fundo retro, 64 cm de diâmetro, lâmpada de halogéneo de 750 watts acionada por um regulador de intensidade interno, iluminação de fundo com LEDs RGB 3 em 1 de 96 peças, 4/6/9 canais DMX, caixa em liga de alumínio, menu LCD",
      categoryId: "cmk1e0n230003tb4gtbayc9jd",
      subcategoryId: "cmk1e0n44000stb4gyw8a3jx9",
      quantity: 2,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/seeding-images/equipment-1767652917348-izz6dgnby.jpg",
      dailyRate: 40,
      type: "equipment",
      version: 2,
      createdBy: null,
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T16:55:54.080Z"),
      updatedAt: new Date("2026-01-06T20:10:21.473Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk1e0n2g0008tb4gn4gfv84j" },
    update: {},
    create: {
      id: "cmk1e0n2g0008tb4gn4gfv84j",
      name: "FOS TITAN BEAM - 230W Moving Head Beam Light",
      description: "Fast and powerful 230W moving head, producing a bright, parallel beam with a 0-3.8° angle. Features 14 colors + white, 17 fixed gobos + open, an 8-facet rotating prism, frost",
      descriptionPt: "Cabeça móvel rápida e potente de 230 W, produzindo um feixe luminoso e paralelo com um ângulo de 0-3,8°. Inclui 14 cores + branco, 17 gobos fixos + abertos, um prisma rotativo de 8 facetas, gelo",
      categoryId: "cmk1e0n230003tb4gtbayc9jd",
      subcategoryId: "cmk1e0n2a0006tb4gfvum37v3",
      quantity: 2,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/seeding-images/equipment-1767652943787-aieb3wm5w.jpg",
      dailyRate: 55,
      type: "equipment",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T16:55:54.083Z"),
      updatedAt: new Date("2026-01-06T16:55:54.083Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk1e0n4s0012tb4glanvxelb" },
    update: {},
    create: {
      id: "cmk1e0n4s0012tb4glanvxelb",
      name: "HK Audio Linear 5 MKII 112 XA",
      description: "The \"Swiss Army Knife\" of professional audio. High-performance, active 12\" loudspeaker built for versatility, serving as crystal-clear front-of-house (FOH)",
      descriptionPt: "O \"canivete suíço\" do áudio profissional. Altifalante ativo de 12\" de elevado desempenho, construído para ser versátil, servindo como um sistema de som cristalino para a frente da sala (FOH)",
      categoryId: "cmk1e0n260004tb4g37154d95",
      subcategoryId: "cmk1e0n4j000ytb4gz5y21ntw",
      quantity: 2,
      status: "good",
      location: "Warehouse B",
      imageUrl: "/seeding-images/equipment-1767653282925-kltb0j1un.jpg",
      dailyRate: 70,
      type: "equipment",
      version: 2,
      createdBy: null,
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T16:55:54.086Z"),
      updatedAt: new Date("2026-01-06T20:13:01.231Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk1e0n4n0010tb4g0yr9ijgx" },
    update: {},
    create: {
      id: "cmk1e0n4n0010tb4g0yr9ijgx",
      name: "HK Audio Linear 5 MKII 118 Sub HPA – High-Power Active Subwoofer",
      description: "Ultimate powerhouse foundation for sound systems. 18\" high-performance active subwoofer engineered to deliver extreme sound pressure levels",
      descriptionPt: "A melhor base de potência para sistemas de som. Subwoofer ativo de 18\" de elevado desempenho concebido para proporcionar níveis de pressão sonora extremos",
      categoryId: "cmk1e0n260004tb4g37154d95",
      subcategoryId: "cmk1e0n4j000ytb4gz5y21ntw",
      quantity: 6,
      status: "good",
      location: "Warehouse B",
      imageUrl: "/seeding-images/equipment-1767653305842-3jb80ag5r.jpg",
      dailyRate: 150,
      type: "equipment",
      version: 2,
      createdBy: null,
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T16:55:54.089Z"),
      updatedAt: new Date("2026-01-06T20:14:10.025Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk1e0n4x0014tb4gghayqvr8" },
    update: {},
    create: {
      id: "cmk1e0n4x0014tb4gghayqvr8",
      name: "HK Audio Linear 5 MKII 308 LTA – Long-Throw Active PA Speaker",
      description: "Ultimate solution when you need to deliver high-fidelity sound over long distances. High-performance, horn-loaded active unit designed to bridge the gap between studio and venue",
      descriptionPt: "A derradeira solução quando é necessário fornecer som de alta fidelidade a longas distâncias. Unidade ativa de alto desempenho, carregada com corneta, concebida para fazer a ponte entre o estúdio e o local",
      categoryId: "cmk1e0n260004tb4g37154d95",
      subcategoryId: "cmk1e0n4j000ytb4gz5y21ntw",
      quantity: 4,
      status: "good",
      location: "Warehouse B",
      imageUrl: "/seeding-images/equipment-1767653325588-zzyp1d648.jpg",
      dailyRate: 100,
      type: "equipment",
      version: 3,
      createdBy: null,
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T16:55:54.093Z"),
      updatedAt: new Date("2026-01-06T20:15:35.189Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk1e0n5i001ctb4gqp1dhbzt" },
    update: {},
    create: {
      id: "cmk1e0n5i001ctb4gqp1dhbzt",
      name: "Mackie Thump 118S – 18\" Professional Active Subwoofer",
      description: "High-performance, heavy-duty subwoofer designed for shaking the room. If your event needs that deep, physical bass that defines professional dance events",
      descriptionPt: "Subwoofer de alto desempenho e resistente, concebido para agitar a sala. Se o seu evento precisa de graves profundos e físicos que definem os eventos de dança profissionais",
      categoryId: "cmk1e0n260004tb4g37154d95",
      subcategoryId: "cmk1e0n4j000ytb4gz5y21ntw",
      quantity: 2,
      status: "good",
      location: "Warehouse B",
      imageUrl: "/images/equipment-1767731688410-3plft6k3a.jpg",
      dailyRate: 100,
      type: "equipment",
      version: 3,
      createdBy: null,
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T16:55:54.095Z"),
      updatedAt: new Date("2026-01-06T20:34:48.413Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk1e0n5e001atb4g5t045ubr" },
    update: {},
    create: {
      id: "cmk1e0n5e001atb4g5t045ubr",
      name: "Mackie Thump 212 – 12\" Professional High-Performance PA",
      description: "Professional-grade loudspeaker designed for those who need high-intensity sound and absolute reliability. Built to deliver \"big stage\" sound in versatile 12-inch format",
      descriptionPt: "Altifalante de nível profissional concebido para quem precisa de som de alta intensidade e fiabilidade absoluta. Construído para proporcionar um som de \"grande palco\" num formato versátil de 12 polegadas",
      categoryId: "cmk1e0n260004tb4g37154d95",
      subcategoryId: "cmk1e0n4j000ytb4gz5y21ntw",
      quantity: 4,
      status: "good",
      location: "Warehouse B",
      imageUrl: "/images/equipment-1767731647952-5a4hietu8.jpg",
      dailyRate: 60,
      type: "equipment",
      version: 3,
      createdBy: null,
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T16:55:54.099Z"),
      updatedAt: new Date("2026-01-06T20:34:07.957Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk1e0n570018tb4gtoctaq22" },
    update: {},
    create: {
      id: "cmk1e0n570018tb4gtoctaq22",
      name: "Mackie Thump 215 – 15\" High-Output Performance PA",
      description: "Built for power. As the largest member of the legendary Thump series, this 15-inch loudspeaker is designed for events that demand high-impact bass and massive coverage",
      descriptionPt: "Construído para potência. Sendo o maior membro da lendária série Thump, este altifalante de 15 polegadas foi concebido para eventos que exigem graves de grande impacto e uma cobertura maciça",
      categoryId: "cmk1e0n260004tb4g37154d95",
      subcategoryId: "cmk1e0n4j000ytb4gz5y21ntw",
      quantity: 2,
      status: "good",
      location: "Warehouse B",
      imageUrl: "/images/equipment-1767731647952-5a4hietu8.jpg",
      dailyRate: 75,
      type: "equipment",
      version: 3,
      createdBy: null,
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T16:55:54.101Z"),
      updatedAt: new Date("2026-01-06T22:06:49.131Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk1e0n63001mtb4gwcx4ojpb" },
    update: {},
    create: {
      id: "cmk1e0n63001mtb4gwcx4ojpb",
      name: "Shure SM57 LC",
      description: "Industry's most trusted professional instrument microphone. Known as the \"Workhorse\", it is the global standard for capturing loud, high-impact sound sources with absolute clarity",
      descriptionPt: "O microfone para instrumentos profissionais mais fiável do sector. Conhecido como o \"cavalo de batalha\", é o padrão global para captar fontes sonoras altas e de alto impacto com absoluta clareza",
      categoryId: "cmk1e0n260004tb4g37154d95",
      subcategoryId: "cmk1e0n5v001itb4g5o2ie47u",
      quantity: 2,
      status: "good",
      location: "Warehouse B",
      imageUrl: "/seeding-images/equipment-1767653442872-f3iq0emiz.jpg",
      dailyRate: 8,
      type: "equipment",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T16:55:54.105Z"),
      updatedAt: new Date("2026-01-06T16:55:54.105Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk1e0n5z001ktb4gzpm5wbbf" },
    update: {},
    create: {
      id: "cmk1e0n5z001ktb4gzpm5wbbf",
      name: "Shure SM58",
      description: "The legendary \"King of Microphones\". Known globally as the industry standard for live vocals, this heavy-duty dynamic mic is famous for its nearly indestructible build and ability to handle extreme SPL",
      descriptionPt: "O lendário \"Rei dos Microfones\". Conhecido mundialmente como o padrão da indústria para vocais ao vivo, este microfone dinâmico de alta resistência é famoso por sua construção quase indestrutível e capacidade de suportar SPL extremos",
      categoryId: "cmk1e0n260004tb4g37154d95",
      subcategoryId: "cmk1e0n5v001itb4g5o2ie47u",
      quantity: 3,
      status: "good",
      location: "Warehouse B",
      imageUrl: "/seeding-images/equipment-1767653472474-dyy4kasov.jpg",
      dailyRate: 8,
      type: "equipment",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T16:55:54.108Z"),
      updatedAt: new Date("2026-01-06T16:55:54.108Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk1rams2000utjehyl67da9p" },
    update: {},
    create: {
      id: "cmk1rams2000utjehyl67da9p",
      name: "Stairville AFH-600 DMX",
      description: "The Stairville AFH-600 is a high-performance atmospheric tool built for professional stage and lighting applications. Unlike standard smoke machines that produce thick, opaque clouds, this Hazer creates a fine, translucent mist that hangs in the air to perfectly define light beams, lasers, and textures. It is the industry-standard choice for ensuring your lighting design is visible from every angle without blocking the audience’s view of the stage",
      descriptionPt: "O Stairville AFH-600 é uma ferramenta atmosférica de alto desempenho criada para aplicações profissionais de palco e iluminação. Ao contrário das máquinas de fumo normais que produzem nuvens espessas e opacas, este Hazer cria uma névoa fina e translúcida que paira no ar para definir perfeitamente feixes de luz, lasers e texturas. É a escolha padrão da indústria para garantir que o seu projeto de iluminação é visível de todos os ângulos sem bloquear a visão do palco por parte do público",
      categoryId: "cmk1e0n230003tb4gtbayc9jd",
      subcategoryId: "cmk1ra3xh000qtjeh69nb1iod",
      quantity: 2,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/seeding-images/equipment-1767653568202-j07l8pxi4.jpg",
      dailyRate: 35,
      type: "equipment",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T16:55:54.112Z"),
      updatedAt: new Date("2026-01-06T16:55:54.112Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk1e0n4b000utb4gst864yww" },
    update: {},
    create: {
      id: "cmk1e0n4b000utb4gst864yww",
      name: "Varytec Retro Blinder TRI 180",
      description: "Add a high-impact \"eye-candy\" effect to your stage or event with this unique triangular fixture combining the nostalgic look of a classic halogen blinder with modern LED technology",
      descriptionPt: "Acrescente um efeito \"eye-candy\" de grande impacto ao seu palco ou evento com esta luminária triangular única que combina o aspeto nostálgico de um projetor de halogéneo clássico com a moderna tecnologia LED",
      categoryId: "cmk1e0n230003tb4gtbayc9jd",
      subcategoryId: "cmk1e0n44000stb4gyw8a3jx9",
      quantity: 2,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/seeding-images/equipment-1767652968319-b8r9chmnd.jpg",
      dailyRate: 45,
      type: "equipment",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T16:55:54.115Z"),
      updatedAt: new Date("2026-01-06T16:55:54.115Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk1e0n3n000qtb4g9j3brv6c" },
    update: {},
    create: {
      id: "cmk1e0n3n000qtb4g9j3brv6c",
      name: "Varytec bat.PAR V2 RGBWW",
      description: "Elevate your event atmosphere with the ultimate cable-free lighting solution. Compact, high-performance LED spotlight designed for quick setup and professional results",
      descriptionPt: "Eleve a atmosfera do seu evento com a derradeira solução de iluminação sem cabos. Projetor LED compacto e de elevado desempenho concebido para uma configuração rápida e resultados profissionais",
      categoryId: "cmk1e0n230003tb4gtbayc9jd",
      subcategoryId: "cmk1e0n3f000mtb4g4wo3p1kw",
      quantity: 9,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/seeding-images/equipment-1767652996994-fco9qoh93.jpg",
      dailyRate: 15,
      type: "equipment",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T16:55:54.118Z"),
      updatedAt: new Date("2026-01-06T16:55:54.118Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk1e0n520016tb4gpdkryc32" },
    update: {},
    create: {
      id: "cmk1e0n520016tb4gpdkryc32",
      name: "dB Technologies ES 802 – Ultra-Portable Column PA System",
      description: "High-output, vertical array system built for those who refuse to compromise on acoustic pressure and sound coverage. Unlike small portable speakers, this system utilizes true column design",
      descriptionPt: "Sistema de matriz vertical de alta potência construído para aqueles que se recusam a comprometer a pressão acústica e a cobertura sonora. Ao contrário das pequenas colunas portáteis, este sistema utiliza um verdadeiro design de coluna",
      categoryId: "cmk1e0n260004tb4g37154d95",
      subcategoryId: "cmk1e0n4j000ytb4gz5y21ntw",
      quantity: 3,
      status: "good",
      location: "Warehouse B",
      imageUrl: "/seeding-images/equipment-1767653633919-hwisdmx1i.jpg",
      dailyRate: 150,
      type: "equipment",
      version: 2,
      createdBy: null,
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T16:55:54.122Z"),
      updatedAt: new Date("2026-01-06T20:17:54.800Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk2u46ju000icw5gr2ziu0lk" },
    update: {},
    create: {
      id: "cmk2u46ju000icw5gr2ziu0lk",
      name: "Epson EB-L530U – High-Performance 5200 Lumens Laser Projector",
      description: "The Epson EB-L530U is a professional-grade, high-brightness laser projector engineered for environments where image quality and reliability are non-negotiable. Delivering 5200 lumens of equal white and color brightness, this unit cuts through ambient light to produce stunningly sharp, vibrant images even in well-lit rooms. As a laser-source projector, it offers a \"set it and forget it\" level of reliability that traditional bulb projectors simply cannot match.",
      descriptionPt: "O Epson EB-L530U é um projetor laser de alto brilho de nível profissional, concebido para ambientes onde a qualidade de imagem e a fiabilidade não são negociáveis. Com 5200 lúmenes de igual brilho branco e de cor, esta unidade atravessa a luz ambiente para produzir imagens incrivelmente nítidas e vibrantes, mesmo em salas bem iluminadas. Sendo um projetor de fonte laser, oferece um nível de fiabilidade do tipo \"instalar e esquecer\" que os projectores de lâmpada tradicionais simplesmente não conseguem igualar.",
      categoryId: "cmk2u2ind000ccw5gwp8sjln3",
      subcategoryId: "cmk2u2qjj000ecw5gonqu3cu9",
      quantity: 1,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767730198067-0inqq5kf8.jpg",
      dailyRate: 250,
      type: "equipment",
      version: 2,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T16:59:32.778Z"),
      updatedAt: new Date("2026-01-06T20:09:58.074Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk2u85k8000ncw5gg7qqxoy4" },
    update: {},
    create: {
      id: "cmk2u85k8000ncw5gg7qqxoy4",
      name: "Showtec 50cm Professional Mirrorball – The Ultimate Stage Classic",
      description: "The Showtec 50cm Mirrorball is the definitive tool for transforming any venue into a high-end dance floor. Designed for professional installations and large-scale events, its massive half-meter diameter ensures thousands of sharp, brilliant light reflections that fill every corner of the room. This is the heavy-duty choice for those who want the authentic, high-impact \"Glitterbox\" aesthetic with a build quality that meets strict professional safety standards.",
      descriptionPt: "O Showtec 50cm Mirrorball é a ferramenta definitiva para transformar qualquer local numa pista de dança de alta qualidade. Concebida para instalações profissionais e eventos de grande escala, o seu enorme diâmetro de meio metro garante milhares de reflexos de luz nítidos e brilhantes que preenchem todos os cantos da sala. Esta é a escolha ideal para quem pretende a estética autêntica e de grande impacto da \"Glitterbox\" com uma qualidade de construção que cumpre as rigorosas normas de segurança profissionais.",
      categoryId: "cmk1e0n230003tb4gtbayc9jd",
      subcategoryId: "cmk1ra3xh000qtjeh69nb1iod",
      quantity: 1,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767718957404-04ewbll5q.jpg",
      dailyRate: 25,
      type: "equipment",
      version: 1,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T17:02:38.120Z"),
      updatedAt: new Date("2026-01-06T17:02:38.120Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk2ucipu000tcw5ge9ooxnrg" },
    update: {},
    create: {
      id: "cmk2ucipu000tcw5ge9ooxnrg",
      name: "Sennheiser EW-D – Pro Digital Wireless ",
      description: "The Sennheiser EW-D is the \"gold standard\" of wireless technology. If you are a musician, a speaker, or an event organizer who cannot afford a single second of static or signal drop-outs, this is the system you rent. It is a digital system, meaning it works more like a secure Wi-Fi connection than an old-fashioned radio, resulting in a sound that is as clear as a high-quality cable.",
      descriptionPt: "O Sennheiser EW-D é o \"padrão de ouro\" da tecnologia sem fios. Se é um músico, um orador ou um organizador de eventos que não se pode dar ao luxo de ter um único segundo de estática ou de falhas de sinal, este é o sistema que deve alugar. É um sistema digital, o que significa que funciona mais como uma ligação Wi-Fi segura do que como um rádio à moda antiga, resultando num som tão nítido como um cabo de alta qualidade.",
      categoryId: "cmk1e0n260004tb4g37154d95",
      subcategoryId: "cmk1e0n5v001itb4g5o2ie47u",
      quantity: 2,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767719161232-niiz3gtsg.jpg",
      dailyRate: 60,
      type: "equipment",
      version: 2,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T17:06:01.794Z"),
      updatedAt: new Date("2026-01-06T17:11:12.260Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk2ufazg000xcw5glbrssj80" },
    update: {},
    create: {
      id: "cmk2ufazg000xcw5glbrssj80",
      name: "Sennheiser ew IEM G4 Twin – Professional Wireless In-Ear Monitoring",
      description: "The Sennheiser G4 Twin is the ultimate professional solution for on-stage monitoring. This \"Twin\" set allows two performers to receive an independent, crystal-clear wireless feed from a single transmitter. By moving your monitoring to in-ears, you eliminate stage noise, prevent feedback, and ensure you hear every note with studio-grade precision, no matter how loud the rest of the band is.",
      descriptionPt: "O Sennheiser G4 Twin é a derradeira solução profissional para monitorização em palco. Este conjunto \"Twin\" permite que dois artistas recebam uma alimentação sem fios independente e cristalina a partir de um único transmissor. Ao transferir a monitorização para os intra-auriculares, elimina o ruído do palco, evita o feedback e garante que ouve cada nota com precisão de estúdio, independentemente do volume do resto da banda.",
      categoryId: "cmk1e0n260004tb4g37154d95",
      subcategoryId: "cmk2ubkmf000pcw5g90hz31lj",
      quantity: 2,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767719291176-8sadamqct.jpg",
      dailyRate: 75,
      type: "equipment",
      version: 1,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T17:08:11.740Z"),
      updatedAt: new Date("2026-01-06T17:08:11.740Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk2uiy4a0011cw5g38yld7kw" },
    update: {},
    create: {
      id: "cmk2uiy4a0011cw5g38yld7kw",
      name: "Sennheiser XSW 2-835 (A-Band) – Professional Wireless Vocal System",
      description: "The Sennheiser XSW 2-835 is a high-performance wireless system built for performers who demand professional reliability and a powerful \"front-of-house\" sound. Featuring the legendary Evolution 835 dynamic capsule, this microphone is engineered to cut through loud stages and high-pressure environments, ensuring your voice remains clear, warm, and prominent in the mix.",
      descriptionPt: "O XSW 2-835 da Sennheiser é um sistema sem fios de alto desempenho concebido para artistas que exigem fiabilidade profissional e um som potente na \"frente da casa\". Com a lendária cápsula dinâmica Evolution 835, este microfone foi concebido para atravessar palcos ruidosos e ambientes de alta pressão, assegurando que a sua voz permanece clara, quente e proeminente na mistura.",
      categoryId: "cmk1e0n260004tb4g37154d95",
      subcategoryId: "cmk1e0n5v001itb4g5o2ie47u",
      quantity: 2,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767719461085-dzicscjph.jpg",
      dailyRate: 40,
      type: "equipment",
      version: 1,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T17:11:01.690Z"),
      updatedAt: new Date("2026-01-06T17:11:01.690Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk2umxbf0015cw5g9wzc1nkj" },
    update: {},
    create: {
      id: "cmk2umxbf0015cw5g9wzc1nkj",
      name: "Sennheiser e 604 – Professional 3-Pack Drum & Percussion Microphones",
      description: "The Sennheiser e 604 is a professional-grade dynamic instrument microphone designed specifically for the high-intensity environment of a drum kit. Part of the legendary Evolution 600 series, this microphone has become the world standard for toms and snare drums. With the ability to handle extreme sound pressure levels and a design that clips directly onto the drum rim, the e 604 delivers a punchy, clear sound without the clutter of mic stands.",
      descriptionPt: "O Sennheiser e 604 é um microfone de instrumento dinâmico de nível profissional concebido especificamente para o ambiente de alta intensidade de um kit de bateria. Parte da lendária série Evolution 600, este microfone tornou-se o padrão mundial para toms e caixas de bateria. Com a capacidade de suportar níveis de pressão sonora extremos e um design que se prende diretamente ao aro da bateria, o e 604 proporciona um som forte e nítido sem a confusão dos suportes de microfone.",
      categoryId: "cmk1e0n260004tb4g37154d95",
      subcategoryId: "cmk1e0n5v001itb4g5o2ie47u",
      quantity: 3,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767719704569-5xd92td6t.jpg",
      dailyRate: 20,
      type: "equipment",
      version: 2,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T17:14:07.275Z"),
      updatedAt: new Date("2026-01-06T17:15:04.572Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk2wnqua0019cw5glo6dnmny" },
    update: {},
    create: {
      id: "cmk2wnqua0019cw5glo6dnmny",
      name: "BSS Audio AR133",
      description: "The BSS AR-133 is the ultimate workhorse of the professional audio industry. Whether in high-end recording studios or on the world’s biggest concert stages, this active DI box is the go-to solution for converting unbalanced signals (like guitars, basses, or keyboards) into a balanced, noise-free feed for your mixer. Known for its tank-like durability and pristine audio transparency, the AR-133 is an essential tool for any serious audio setup.",
      descriptionPt: "O BSS AR-133 é o melhor cavalo de batalha da indústria de áudio profissional. Quer seja em estúdios de gravação topo de gama ou nos maiores palcos de concertos do mundo, esta caixa DI ativa é a solução ideal para converter sinais desequilibrados (como guitarras, baixos ou teclados) numa alimentação equilibrada e sem ruído para o seu misturador. Conhecida pela sua durabilidade semelhante à de um tanque e transparência de áudio cristalina, a AR-133 é uma ferramenta essencial para qualquer configuração de áudio séria.",
      categoryId: "cmk1e0n260004tb4g37154d95",
      subcategoryId: "cmk2ubkmf000pcw5g90hz31lj",
      quantity: 9,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767723044077-g6xn9s5e8.jpg",
      dailyRate: 15,
      type: "equipment",
      version: 1,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T18:10:44.770Z"),
      updatedAt: new Date("2026-01-06T18:10:44.770Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk2wrct6001dcw5gl78mgwlg" },
    update: {},
    create: {
      id: "cmk2wrct6001dcw5gl78mgwlg",
      name: "sE Electronics sE8 Stereo Set – Professional Matched Pair Condenser Microphones",
      description: "A professional matched pair of small-diaphragm condensers for perfect stereo imaging. Handcrafted with gold-sputtered capsules, these mics deliver studio-grade transparency and a smooth high-end. Ideal for acoustic guitars, pianos, and drum overheads. Features switchable pads and low-cut filters to handle any volume.",
      descriptionPt: "Um par profissional de condensadores de diafragma pequeno para uma imagem estéreo perfeita. Fabricados artesanalmente com cápsulas com pulverização de ouro, estes microfones proporcionam transparência de nível de estúdio e um som de alta qualidade suave. Ideal para guitarras acústicas, pianos e overheads de bateria. Inclui pads comutáveis e filtros de corte baixo para lidar com qualquer volume.",
      categoryId: "cmk1e0n260004tb4g37154d95",
      subcategoryId: "cmk1e0n5v001itb4g5o2ie47u",
      quantity: 1,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767723212708-n6iimqnfa.jpg",
      dailyRate: 30,
      type: "equipment",
      version: 1,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T18:13:33.210Z"),
      updatedAt: new Date("2026-01-06T18:13:33.210Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk2x0fma001jcw5g9u7udc4v" },
    update: {},
    create: {
      id: "cmk2x0fma001jcw5g9u7udc4v",
      name: "Allen & Heath CQ-18T 18-Channel Digital Mixer",
      description: "The Allen & Heath CQ-18T is an ultra-compact 96kHz digital mixer designed for bands, producers, and AV rentals. It features 16 high-quality mic preamps, a 7” capacitive touchscreen, and built-in Dual-Band Wi-Fi for seamless app control. With smart tools like Gain Assistant and Feedback Assistant, it simplifies complex mixing tasks. It also supports multitrack recording via SD card or USB, making it a versatile powerhouse for live sound and studio applications in a portable format.",
      descriptionPt: "O Allen & Heath CQ-18T é um misturador digital ultracompacto de 96kHz concebido para bandas, produtores e alugueres de AV. Possui 16 pré-amplificadores de microfone de alta qualidade, um ecrã tátil capacitivo de 7\" e Wi-Fi de banda dupla incorporado para um controlo de aplicações sem falhas. Com ferramentas inteligentes como o Gain Assistant e o Feedback Assistant, simplifica tarefas de mistura complexas. Também suporta gravação multipista através de cartão SD ou USB, o que o torna uma potência versátil para aplicações de som ao vivo e de estúdio num formato portátil.",
      categoryId: "cmk1e0n260004tb4g37154d95",
      subcategoryId: "cmk2wxsub001fcw5gcpkpmxpz",
      quantity: 0,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767723636172-17chqi2sw.jpg",
      dailyRate: 85,
      type: "equipment",
      version: 1,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T18:20:36.754Z"),
      updatedAt: new Date("2026-01-06T18:20:36.754Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk2x39p0001ncw5gq1yjj4p0" },
    update: {},
    create: {
      id: "cmk2x39p0001ncw5gq1yjj4p0",
      name: "Chauvet DJ EZpin Zoom Pack (4 Battery-Powered Pinspots)",
      description: "The EZpin Zoom Pack is a versatile lighting kit featuring four battery-operated LED pinspots, ideal for highlighting centerpieces or architectural details. Each fixture includes a manual zoom for precise beam control and a magnetic base for easy attachment to metal surfaces. The pack includes a dedicated carrying bag and an IRC-6 remote, allowing for effortless wireless operation. Perfect for weddings and corporate events in Lisbon where cable-free, discreet lighting is required.",
      descriptionPt: "O EZpin Zoom Pack é um kit de iluminação versátil que inclui quatro pinspots LED a pilhas, ideais para realçar peças centrais ou detalhes arquitectónicos. Cada luminária inclui um zoom manual para um controlo preciso do feixe e uma base magnética para fácil fixação a superfícies metálicas. O pacote inclui um saco de transporte dedicado e um controlo remoto IRC-6, permitindo uma operação sem fios sem esforço. Perfeito para casamentos e eventos empresariais em Lisboa, onde é necessária uma iluminação discreta e sem cabos.",
      categoryId: "cmk1e0n230003tb4gtbayc9jd",
      subcategoryId: "cmk1e0n3f000mtb4g4wo3p1kw",
      quantity: 1,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767723768626-02ifemf9j.jpg",
      dailyRate: 65,
      type: "equipment",
      version: 1,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T18:22:49.044Z"),
      updatedAt: new Date("2026-01-06T18:22:49.044Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk2x4wsq001rcw5gx7hiq14d" },
    update: {},
    create: {
      id: "cmk2x4wsq001rcw5gx7hiq14d",
      name: "Shure Beta 52A Dynamic Kick Drum Microphone",
      description: "The Shure Beta 52A is a high-output supercardioid dynamic microphone tailored for low-frequency punch. It features a frequency response of 20Hz-10kHz, specifically designed for kick drums and bass amplifiers. With a maximum SPL of 174dB, it handles extreme volume without distortion.",
      descriptionPt: "O Shure Beta 52A é um microfone dinâmico supercardióide de alta saída, concebido para uma potência de baixa frequência. Apresenta uma resposta de frequência de 20Hz-10kHz, especificamente concebida para kick drums e amplificadores de graves. Com um SPL máximo de 174dB, suporta volumes extremos sem distorção.",
      categoryId: "cmk1e0n260004tb4g37154d95",
      subcategoryId: "cmk1e0n5v001itb4g5o2ie47u",
      quantity: 1,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767723845143-hun4264n3.webp",
      dailyRate: 20,
      type: "equipment",
      version: 3,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T18:24:05.642Z"),
      updatedAt: new Date("2026-01-06T20:18:39.174Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk2xmmta001wcw5gq6hm5iwg" },
    update: {},
    create: {
      id: "cmk2xmmta001wcw5gq6hm5iwg",
      name: "Sennheiser HT 747 Black Headset Microphone",
      description: "The Sennheiser HT 747 is a high-performance supercardioid headset microphone designed for active users. It features a sweat-resistant construction and a secure dual-ear-hook design with an adjustable neckband. Technical specs include a 100Hz-15kHz frequency response and 125dB max SPL, ensuring clear speech while rejecting background noise. Ideal for fitness instructors, sports commentators, and high-movement stage performances requiring reliable, hands-free audio.",
      descriptionPt: "O Sennheiser HT 747 é um microfone de auricular supercardióide de alto desempenho concebido para utilizadores activos. Possui uma construção resistente ao suor e um design seguro de gancho duplo para o ouvido com uma banda de pescoço ajustável. As especificações técnicas incluem uma resposta de frequência de 100 Hz-15 kHz e um SPL máximo de 125 dB, garantindo um discurso claro e rejeitando o ruído de fundo. Ideal para instrutores de fitness, comentadores desportivos e actuações em palco de grande movimento que exijam áudio fiável e mãos-livres.",
      categoryId: "cmk1e0n260004tb4g37154d95",
      subcategoryId: "cmk1e0n5v001itb4g5o2ie47u",
      quantity: 2,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767724671991-uwbfmve0u.jpg",
      dailyRate: 25,
      type: "equipment",
      version: 1,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T18:37:52.510Z"),
      updatedAt: new Date("2026-01-06T18:37:52.510Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk2xq3nj0022cw5g47nd8irb" },
    update: {},
    create: {
      id: "cmk2xq3nj0022cw5g47nd8irb",
      name: "Stairville FS-x150 LED Follow Spot",
      description: "Professional LED follow spot featuring a 150W cool white LED source. It offers a 10° beam angle ideal for distances up to 15 meters, with a 5-color wheel and stepless iris control. Supports DMX and manual operation with adjustable dimming curves and electronic shutter. Perfect for theaters, small concerts, and school auditorium events.",
      descriptionPt: "Refletor LED profissional com uma fonte LED branca fria de 150 W. Oferece um ângulo de feixe de 10° ideal para distâncias até 15 metros, com uma roda de 5 cores e controlo de íris contínuo. Suporta DMX e funcionamento manual com curvas de regulação ajustáveis e obturador eletrónico. Perfeito para teatros, pequenos concertos e eventos em auditórios de escolas.",
      categoryId: "cmk1e0n230003tb4gtbayc9jd",
      subcategoryId: "cmk2xpun6001ycw5gbbd6i2bz",
      quantity: 1,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767724833758-qm46q31oe.jpg",
      dailyRate: 45,
      type: "equipment",
      version: 1,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T18:40:34.303Z"),
      updatedAt: new Date("2026-01-06T18:40:34.303Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk2xxr6w0029cw5g6kr0ovvn" },
    update: {},
    create: {
      id: "cmk2xxr6w0029cw5g6kr0ovvn",
      name: "Extension Cable CEE 32A 5-Pin - 50m ",
      description: "Professional 50-meter power extension featuring high-quality CEE 32A 5-pin male and female connectors. Built with heavy-duty H07RN-F 5G2.5 cable, it is designed for extreme mechanical stress and outdoor use (IP44). Provides reliable three-phase power distribution for lighting rigs, sound systems, and industrial machinery. Essential for large-scale events requiring long-distance power runs without significant voltage drop.",
      descriptionPt: "Extensão de alimentação profissional de 50 metros com conectores CEE 32A de 5 pinos macho e fêmea de alta qualidade. Construída com um cabo H07RN-F 5G2.5 resistente, foi concebida para suportar esforços mecânicos extremos e utilização no exterior (IP44). Proporciona uma distribuição de energia trifásica fiável para equipamentos de iluminação, sistemas de som e maquinaria industrial. Essencial para eventos de grande escala que exijam percursos de energia de longa distância sem queda de tensão significativa.",
      categoryId: "cmk2xt5s50023cw5g2242d74c",
      subcategoryId: "cmk2xxaci0025cw5gl37pa6cl",
      quantity: 2,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767725190598-05vyor5z4.jpg",
      dailyRate: 20,
      type: "equipment",
      version: 2,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T18:46:31.400Z"),
      updatedAt: new Date("2026-01-06T20:09:17.400Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk2y0em9002dcw5ga6b63e96" },
    update: {},
    create: {
      id: "cmk2y0em9002dcw5ga6b63e96",
      name: "Yamaha MG16XU 16-Channel Analog Mixer",
      description: "The Yamaha MG16XU is a versatile 16-channel analog mixing console featuring 10 studio-grade \"D-PRE\" discrete class-A mic preamps. It includes a built-in SPX digital effects processor with 24 programs and a 24-bit/192kHz USB audio interface for seamless recording. With 1-knob compressors and a rugged metal chassis, it is ideal for live bands, corporate events, and theater productions requiring transparent sound and reliable dynamics control.",
      descriptionPt: "A Yamaha MG16XU é uma versátil consola de mistura analógica de 16 canais com 10 pré-amplificadores de microfone discretos classe A \"D-PRE\" de qualidade de estúdio. Inclui um processador de efeitos digitais SPX incorporado com 24 programas e uma interface de áudio USB de 24 bits/192 kHz para uma gravação perfeita. Com compressores de 1 botão e um chassis metálico robusto, é ideal para bandas ao vivo, eventos empresariais e produções teatrais que exijam um som transparente e um controlo de dinâmica fiável.",
      categoryId: "cmk1e0n260004tb4g37154d95",
      subcategoryId: "cmk2wxsub001fcw5gcpkpmxpz",
      quantity: 1,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767725314622-lxldlp09l.jpg",
      dailyRate: 40,
      type: "equipment",
      version: 1,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T18:48:35.073Z"),
      updatedAt: new Date("2026-01-06T18:48:35.073Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk2y38b2002hcw5gmkv9xf4u" },
    update: {},
    create: {
      id: "cmk2y38b2002hcw5gmkv9xf4u",
      name: "Varytec VP-m20 Mobile Video BiLight PA",
      description: "The Varytec VP-m20 is a compact 45W LED video panel featuring 300 SMD LEDs with a high CRI of 95 for natural color rendering. It offers a steplessly adjustable color temperature from 2850K to 5700K and a wide 120-degree beam angle. The integrated battery provides up to 7.5 hours of operation, making it ideal for mobile journalism, professional streaming, and on-location photography. Includes built-in barndoors and a USB port for charging external mobile devices.",
      descriptionPt: "O Varytec VP-m20 é um painel de vídeo LED compacto de 45 W com 300 LEDs SMD com um CRI elevado de 95 para uma reprodução de cor natural. Oferece uma temperatura de cor ajustável de 2850K a 5700K e um amplo ângulo de feixe de 120 graus. A bateria integrada proporciona até 7,5 horas de funcionamento, tornando-o ideal para jornalismo móvel, transmissão profissional e fotografia no local. Inclui barndoors incorporados e uma porta USB para carregar dispositivos móveis externos.",
      categoryId: "cmk1e0n230003tb4gtbayc9jd",
      subcategoryId: "cmk1e0n3f000mtb4g4wo3p1kw",
      quantity: 2,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767725446422-82blp7cdk.jpg",
      dailyRate: 15,
      type: "equipment",
      version: 1,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T18:50:46.861Z"),
      updatedAt: new Date("2026-01-06T18:50:46.861Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk2y5ofe002lcw5gdzjsf1k4" },
    update: {},
    create: {
      id: "cmk2y5ofe002lcw5gdzjsf1k4",
      name: "Stairville LED BossFX-1 Pro Bundle Complete",
      description: "The Stairville LED BossFX-1 Pro is a versatile multi-effect lighting system including two RGBW LED spots, two derby effects, and four strobe LEDs. It features a built-in laser for extra visual impact. Technical specs include DMX-512 control, sound-to-light mode, and an integrated wireless footswitch. This complete bundle comes with a sturdy tripod and a transport bag. Perfect for mobile DJs, small bands, and private events in Lisbon venues.",
      descriptionPt: "O Stairville LED BossFX-1 Pro é um sistema de iluminação multi-efeitos versátil que inclui dois spots LED RGBW, dois efeitos derby e quatro LEDs estroboscópicos. Inclui um laser incorporado para um impacto visual extra. As especificações técnicas incluem controlo DMX-512, modo de som para luz e um pedal sem fios integrado. Este conjunto completo inclui um tripé robusto e um saco de transporte. Perfeito para DJs móveis, pequenas bandas e eventos privados em locais de Lisboa.",
      categoryId: "cmk1e0n230003tb4gtbayc9jd",
      subcategoryId: "cmk1e0n2w000etb4gowy0l9bi",
      quantity: 1,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767725560625-m0b6lal65.jpg",
      dailyRate: 45,
      type: "equipment",
      version: 1,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T18:52:41.066Z"),
      updatedAt: new Date("2026-01-06T18:52:41.066Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk2ybpar002scw5gzvkzclo8" },
    update: {},
    create: {
      id: "cmk2ybpar002scw5gzvkzclo8",
      name: "Equation 330W Industrial Floor Drum Fan (60cm)",
      description: "High-performance industrial drum fan featuring a robust 330W motor and a 60cm diameter. It offers two speed settings for adjustable airflow and a tiltable head for precise direction. Technical specs include an 85dB noise level, steel construction, and integrated wheels for easy mobility. Ideal for cooling stages, drying outdoor event surfaces, and improving ventilation in warehouse venues or temporary festival marquees.",
      descriptionPt: "Ventilador de tambor industrial de elevado desempenho, com um motor robusto de 330 W e um diâmetro de 60 cm. Oferece duas definições de velocidade para um fluxo de ar ajustável e uma cabeça inclinável para uma direção precisa. As especificações técnicas incluem um nível de ruído de 85dB, construção em aço e rodas integradas para uma fácil mobilidade. Ideal para arrefecer palcos, secar superfícies de eventos ao ar livre e melhorar a ventilação em armazéns ou tendas de festivais temporários.",
      categoryId: "cmk2yahn1002mcw5gvbcgkszj",
      subcategoryId: "cmk2yav4d002ocw5g7jyebitz",
      quantity: 1,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767725841712-ugyud7rwy.jpeg",
      dailyRate: 20,
      type: "equipment",
      version: 1,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T18:57:22.131Z"),
      updatedAt: new Date("2026-01-06T18:57:22.131Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk2ydtdv002wcw5gstwcmpu9" },
    update: {},
    create: {
      id: "cmk2ydtdv002wcw5gstwcmpu9",
      name: "Deluxe Bubble Machine",
      description: "The Deluxe Bubble Machine is a high-output effects unit featuring dual rotating wands for a continuous stream of large bubbles. It utilizes a heavy-duty motor housed in a durable metal casing with a built-in fan for effective bubble projection. With a 0.6-liter fluid tank and easy-to-use manual operation, it is designed for reliable performance.",
      descriptionPt: "A Deluxe Bubble Machine é uma unidade de efeitos de alto rendimento com duas varinhas rotativas para um fluxo contínuo de grandes bolhas. Utiliza um motor de alta resistência alojado numa caixa de metal durável com uma ventoinha incorporada para uma projeção eficaz das bolhas. Com um depósito de fluido de 0,6 litros e um funcionamento manual fácil de utilizar, foi concebido para um desempenho fiável.",
      categoryId: "cmk1e0n230003tb4gtbayc9jd",
      subcategoryId: "cmk1ra3xh000qtjeh69nb1iod",
      quantity: 1,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767725940241-pzg7z0307.jpg",
      dailyRate: 15,
      type: "equipment",
      version: 1,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T18:59:00.739Z"),
      updatedAt: new Date("2026-01-06T18:59:00.739Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk2yhxxj0033cw5gde4tj1nh" },
    update: {},
    create: {
      id: "cmk2yhxxj0033cw5gde4tj1nh",
      name: "Stairville Tour Stage Platform 2x1m ODW",
      description: "Professional heavy-duty stage platform measuring 200x100cm, built with a lightweight aluminum frame and a weatherproof plywood surface. It features a HEXA anti-slip coating and a massive load capacity of 750kg/m². Designed for both indoor and outdoor use, its ergonomic profile allows for rapid assembly using standard 60x60mm legs. Perfect for festival stages, corporate risers, drum platforms, and catwalks in professional venues.",
      descriptionPt: "Plataforma de palco profissional para trabalhos pesados com 200x100cm, construída com uma estrutura de alumínio leve e uma superfície de contraplacado resistente às intempéries. Possui um revestimento antiderrapante HEXA e uma enorme capacidade de carga de 750 kg/m². Concebida para utilização no interior e no exterior, o seu perfil ergonómico permite uma montagem rápida utilizando pernas normais de 60x60 mm. Perfeita para palcos de festivais, plataformas de empresas, plataformas de bateria e passadiços em locais profissionais.",
      categoryId: "cmk1e0n230003tb4gtbayc9jd",
      subcategoryId: "cmk2yguod002zcw5gazl94gfi",
      quantity: 12,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767726132834-p25yooegg.jpg",
      dailyRate: 25,
      type: "equipment",
      version: 1,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T19:02:13.254Z"),
      updatedAt: new Date("2026-01-06T19:02:13.254Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk2yljqx0037cw5gystjn9ij" },
    update: {},
    create: {
      id: "cmk2yljqx0037cw5gystjn9ij",
      name: "Albrecht Tectalk Worker 3 Wireless Intercom Set (4-Way)",
      description: "Professional PMR446 radio set featuring four robust handheld units designed for event coordination. These radios offer 16 channels, hands-free VOX functionality, and a high-capacity 1200mAh battery for 14-hour shifts. The set includes a multi-charger station and four security-style headsets with integrated microphones. Housed in a heavy-duty hardshell transport case, this system ensures reliable, interference-free communication across large venues, festival sites, and production teams.",
      descriptionPt: "Conjunto de rádios profissionais PMR446 com quatro unidades portáteis robustas concebidas para a coordenação de eventos. Estes rádios oferecem 16 canais, funcionalidade VOX mãos-livres e uma bateria de 1200mAh de elevada capacidade para turnos de 14 horas. O conjunto inclui uma estação de carregamento múltiplo e quatro auriculares de segurança com microfones integrados. Alojado numa mala de transporte rígida e resistente, este sistema assegura uma comunicação fiável e sem interferências em grandes recintos, locais de festivais e equipas de produção.",
      categoryId: "cmk1e0n260004tb4g37154d95",
      subcategoryId: "cmk2ubkmf000pcw5g90hz31lj",
      quantity: 1,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767726301040-jqxnwdd3m.jpg",
      dailyRate: 25,
      type: "equipment",
      version: 1,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T19:05:01.497Z"),
      updatedAt: new Date("2026-01-06T19:05:01.497Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk2ynljn003dcw5gvcx7adg4" },
    update: {},
    create: {
      id: "cmk2ynljn003dcw5gvcx7adg4",
      name: "Pioneer DJ CDJ-3000 Professional Multi Player",
      description: "The Pioneer CDJ-3000 is a professional flagship multi-player powered by a state-of-the-art MPU for advanced performance and stability. It features a 9-inch high-resolution touch screen, eight dedicated Hot Cue buttons, and a redesigned mechanical jog wheel for ultra-smooth scratching. With 96kHz/32-bit audio processing and Pro DJ Link with Gigabit Ethernet, it is the global industry standard for festival stages, nightclubs, and high-end corporate events.",
      descriptionPt: "O CDJ-3000 da Pioneer é um leitor multileitor profissional de topo, equipado com uma MPU de última geração para um desempenho e estabilidade avançados. Possui um ecrã tátil de alta resolução de 9 polegadas, oito botões Hot Cue dedicados e um jog wheel mecânico redesenhado para um scratching ultra-suave. Com processamento de áudio de 96kHz/32-bit e Pro DJ Link com Gigabit Ethernet, é o padrão global da indústria para palcos de festivais, clubes noturnos e eventos empresariais de alta qualidade.",
      categoryId: "cmk1e0n260004tb4g37154d95",
      subcategoryId: "cmk2yn0840039cw5gavgf2wsn",
      quantity: 4,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767726396715-qpu48vri9.jpg",
      dailyRate: 100,
      type: "equipment",
      version: 1,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T19:06:37.139Z"),
      updatedAt: new Date("2026-01-06T19:06:37.139Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk2yptia003hcw5g6yj1adjp" },
    update: {},
    create: {
      id: "cmk2yptia003hcw5g6yj1adjp",
      name: "Pioneer DJ DJM-V10-LF Professional 6-Channel Mixer",
      description: "The DJM-V10-LF is a 6-channel professional mixer featuring 60mm long-throw faders for precise volume control. It boasts studio-quality 64-bit processing, 32-bit AD/DA converters, and a 4-band EQ on every channel. With a dedicated compressor, expanded send/return section, and 3-band master isolator, it delivers elite sound quality. Dual headphone outputs and a booth EQ make it the ultimate choice for complex festival setups and high-end club performances in Lisbon.",
      descriptionPt: "A DJM-V10-LF é uma mesa de mistura profissional de 6 canais com faders de longo alcance de 60 mm para um controlo preciso do volume. Possui processamento de 64-bit com qualidade de estúdio, conversores AD/DA de 32-bit e um EQ de 4 bandas em cada canal. Com um compressor dedicado, uma secção de envio/retorno expandida e um isolador principal de 3 bandas, proporciona uma qualidade de som de elite. Saídas duplas para auscultadores e um equalizador de cabine fazem dele a melhor escolha para configurações complexas de festivais e actuações em clubes de topo em Lisboa.",
      categoryId: "cmk1e0n260004tb4g37154d95",
      subcategoryId: "cmk2yn0840039cw5gavgf2wsn",
      quantity: 1,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767726500168-9d7keduzl.jpg",
      dailyRate: 150,
      type: "equipment",
      version: 1,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T19:08:20.768Z"),
      updatedAt: new Date("2026-01-06T19:08:20.768Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk2ysdvr003lcw5g189invzn" },
    update: {},
    create: {
      id: "cmk2ysdvr003lcw5g189invzn",
      name: "Pioneer DJ XDJ-RX3 All-In-One DJ System",
      description: "The Pioneer XDJ-RX3 is a professional 2-channel all-in-one DJ system featuring a 10.1-inch high-resolution touchscreen. It inherits its layout and performance features from the club-standard CDJ-3000 and DJM-900NXS2, including 14 Beat FX and 6 Sound Color FX. Supporting rekordbox and Serato DJ Pro, it offers an enhanced GUI for faster browsing and smooth waveforms. Ideal for mobile DJs, corporate events, and wedding receptions.",
      descriptionPt: "O Pioneer XDJ-RX3 é um sistema profissional de DJ tudo-em-um de 2 canais com um ecrã tátil de alta resolução de 10,1 polegadas. Herda o seu layout e caraterísticas de desempenho do CDJ-3000 e da DJM-900NXS2, padrão de clube, incluindo 14 Beat FX e 6 Sound Color FX. Compatível com o rekordbox e o Serato DJ Pro, oferece uma GUI melhorada para uma navegação mais rápida e formas de onda suaves. Ideal para DJs móveis, eventos empresariais e recepções de casamento.",
      categoryId: "cmk1e0n260004tb4g37154d95",
      subcategoryId: "cmk2yn0840039cw5gavgf2wsn",
      quantity: 1,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767726619867-qm3uxznua.png",
      dailyRate: 100,
      type: "equipment",
      version: 1,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T19:10:20.484Z"),
      updatedAt: new Date("2026-01-06T19:10:20.484Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk2ywvbj003pcw5g88a5boe9" },
    update: {},
    create: {
      id: "cmk2ywvbj003pcw5g88a5boe9",
      name: "Allen & Heath Xone:92 Limited Edition (20th Anniversary)",
      description: "The Xone:92 Limited Edition is a premium 6-channel analog mixer celebrating two decades of the industry-standard \"92\" sound. This collector’s version features a retro silver top plate, updated RIAA phono preamps specifically tuned for electronic vinyl, and a custom mini innoFADER Pro for superior handling. It retains the legendary dual VCF filters (now with silent switching) and the iconic 4-band \"total kill\" EQ. With only 920 units produced worldwide.",
      descriptionPt: "A Xone:92 Limited Edition é uma mesa de mistura analógica de 6 canais de qualidade superior que celebra duas décadas do som \"92\" padrão da indústria. Esta versão de colecionador apresenta uma placa superior prateada retro, pré-amplificadores fono RIAA actualizados, especificamente sintonizados para vinil eletrónico, e um mini innoFADER Pro personalizado para um manuseamento superior. Mantém os lendários filtros VCF duplos (agora com comutação silenciosa) e o icónico equalizador de 4 bandas \"total kill\". Com apenas 920 unidades produzidas em todo o mundo.",
      categoryId: "cmk1e0n260004tb4g37154d95",
      subcategoryId: "cmk2yn0840039cw5gavgf2wsn",
      quantity: 1,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767726829084-or1p4q885.jpg",
      dailyRate: 120,
      type: "equipment",
      version: 2,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T19:13:49.710Z"),
      updatedAt: new Date("2026-01-06T20:06:35.621Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk2yz93t003tcw5gytrhmfpv" },
    update: {},
    create: {
      id: "cmk2yz93t003tcw5gytrhmfpv",
      name: "Allen and Heath Xone:23 ",
      description: "A high-performance 2-channel analog mixer featuring the legendary Xone filter system with voltage-controlled resonance. It offers 2+2 channels with dual phono/line inputs, 3-band total kill EQ, and a professional FX loop. Its robust build and balanced XLR outputs deliver studio-quality audio in a compact frame. Ideal for small club setups, vinyl enthusiasts, and high-end private events requiring the signature warm analog sound.",
      descriptionPt: "Uma mesa de mistura analógica de 2 canais de alto desempenho que inclui o lendário sistema de filtros Xone com ressonância controlada por tensão. Oferece 2+2 canais com entradas duplas de fono/linha, equalização total de 3 bandas e um loop FX profissional. A sua construção robusta e as saídas XLR equilibradas proporcionam áudio com qualidade de estúdio numa estrutura compacta. Ideal para pequenos clubes, entusiastas do vinil e eventos privados de alta qualidade que requerem o som analógico quente caraterístico.",
      categoryId: "cmk1e0n260004tb4g37154d95",
      subcategoryId: "cmk2yn0840039cw5gavgf2wsn",
      quantity: 1,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767726940362-d3fdymazt.jpg",
      dailyRate: 50,
      type: "equipment",
      version: 1,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T19:15:40.888Z"),
      updatedAt: new Date("2026-01-06T19:15:40.888Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk2z5gsj003xcw5gzxv14a5h" },
    update: {},
    create: {
      id: "cmk2z5gsj003xcw5gzxv14a5h",
      name: "Technics SL-1200 MK2 Direct-Drive Turntable",
      description: "The world’s most iconic analog DJ turntable. Renowned for its heavy-duty construction and vibration-resistant rubber base, it features a high-torque direct-drive motor that reaches full speed in 0.7s. Includes quartz-locked continuous pitch control (±8%) and a highly sensitive S-shaped tonearm. Built for absolute precision and durability, it remains the primary choice for professional vinyl DJs and high-end club setups globally.",
      descriptionPt: "O gira-discos analógico para DJ mais icónico do mundo. Reconhecido pela sua construção robusta e base de borracha resistente a vibrações, possui um motor de acionamento direto de binário elevado que atinge a velocidade máxima em 0,7s. Inclui controlo de pitch contínuo bloqueado por quartzo (±8%) e um braço em forma de S altamente sensível. Construído para uma precisão e durabilidade absolutas, continua a ser a principal escolha para DJs profissionais de vinil e configurações de discotecas topo de gama em todo o mundo.",
      categoryId: "cmk1e0n260004tb4g37154d95",
      subcategoryId: "cmk2yn0840039cw5gavgf2wsn",
      quantity: 2,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767727230221-ew0j7mqa4.jpg",
      dailyRate: 60,
      type: "equipment",
      version: 2,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T19:20:30.786Z"),
      updatedAt: new Date("2026-01-06T20:19:32.888Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk2z91i70041cw5gcmovaham" },
    update: {},
    create: {
      id: "cmk2z91i70041cw5gcmovaham",
      name: "ADAM Audio A7X Active Studio Monitor",
      description: "High-performance active monitor ideal for event production, VIP lounges, and backstage monitoring. Featuring the precision X-ART tweeter and a 7\" woofer, it delivers transparent, fatigue-free sound even during long shifts. Its compact design and front-panel power/volume controls make it perfect for temporary setups in warehouses or corporate Green Rooms. Reliable XLR/RCA inputs ensure quick integration into professional AV racks or mobile DJ booths.",
      descriptionPt: "Monitor ativo de elevado desempenho ideal para produção de eventos, salas VIP e monitorização de bastidores. Com o tweeter de precisão X-ART e um woofer de 7\", proporciona um som transparente e sem fadiga, mesmo durante turnos longos. O seu design compacto e os controlos de potência/volume no painel frontal tornam-no perfeito para configurações temporárias em armazéns ou salas verdes de empresas. As fiáveis entradas XLR/RCA garantem uma rápida integração em racks AV profissionais ou cabines de DJ móveis.",
      categoryId: "cmk1e0n260004tb4g37154d95",
      subcategoryId: "cmk1e0n4j000ytb4gz5y21ntw",
      quantity: 2,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767727397136-sohalsbe7.jpg",
      dailyRate: 50,
      type: "equipment",
      version: 1,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T19:23:17.596Z"),
      updatedAt: new Date("2026-01-06T19:23:17.596Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk2zbqg90045cw5gidb6ou9i" },
    update: {},
    create: {
      id: "cmk2zbqg90045cw5gidb6ou9i",
      name: "Mini LED Moving Head Spot 25W",
      description: "Ultra-compact 25W LED moving head spotlight designed for dynamic event lighting. Features 7 patterns (gobos) and 7 vibrant colors plus white, with high-speed pan and tilt movements. Operating modes include DMX512 control, sound-activated, and automatic programs. Its lightweight, portable design makes it perfect for mobile DJ booths, small stages, and private parties looking for professional club-style effects in a compact format",
      descriptionPt: "Projetor de cabeça móvel LED ultra-compacto de 25 W concebido para iluminação dinâmica de eventos. Inclui 7 padrões (gobos) e 7 cores vibrantes mais branco, com movimentos de rotação e inclinação de alta velocidade. Os modos de funcionamento incluem controlo DMX512, ativação por som e programas automáticos. O seu design leve e portátil torna-o perfeito para cabinas de DJ móveis, pequenos palcos e festas privadas que procuram efeitos profissionais de estilo de clube num formato compacto",
      categoryId: "cmk1e0n230003tb4gtbayc9jd",
      subcategoryId: "cmk1e0n2a0006tb4gfvum37v3",
      quantity: 2,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767727522753-rl2wozqhe.jpg",
      dailyRate: 15,
      type: "equipment",
      version: 1,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T19:25:23.240Z"),
      updatedAt: new Date("2026-01-06T19:25:23.240Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk2zg2yz004bcw5go4az2yik" },
    update: {},
    create: {
      id: "cmk2zg2yz004bcw5go4az2yik",
      name: "ChamSys MagicDMX Full USB DMX Interface",
      description: "The ChamSys MagicDMX Full is a professional-grade USB-to-DMX interface designed for the MagicQ software ecosystem. It provides a single universe of DMX output via a 5-pin XLR connector without time restrictions. This compact device supports RDM and is essential for lighting technicians requiring a portable, reliable link between a PC/Mac and lighting fixtures. It offers full control of 512 channels, making it perfect for small shows, testing, and high-end architectural lighting setups.",
      descriptionPt: "O ChamSys MagicDMX Full é uma interface USB-to-DMX de nível profissional concebida para o ecossistema do software MagicQ. Fornece um único universo de saída DMX através de um conetor XLR de 5 pinos sem restrições de tempo. Este dispositivo compacto suporta RDM e é essencial para os técnicos de iluminação que necessitam de uma ligação portátil e fiável entre um PC/Mac e os aparelhos de iluminação. Oferece controlo total de 512 canais, o que o torna perfeito para pequenos espectáculos, testes e configurações de iluminação arquitetónica de alta qualidade.",
      categoryId: "cmk1e0n230003tb4gtbayc9jd",
      subcategoryId: "cmk2zfbje0047cw5gihy6kc4h",
      quantity: 2,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767727725526-53z2r5wpy.png",
      dailyRate: 50,
      type: "equipment",
      version: 2,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T19:28:46.091Z"),
      updatedAt: new Date("2026-01-06T20:10:49.855Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk2ziybe004fcw5gk1cln47p" },
    update: {},
    create: {
      id: "cmk2ziybe004fcw5gk1cln47p",
      name: "ChamSys MagicQ Compact Connect USB Controller",
      description: "he MagicQ Compact Connect is a lightweight, professional USB control surface that transforms any PC or Mac into a powerful lighting station. It features 10 playback faders, 8 attribute encoders, and 2 direct DMX outputs. Supporting 64 universes via its onboard network port, it offers tactile control for lighting, media, and LEDs. Small enough for hand luggage, it includes an internal USB hub and audio input, making it the ultimate tool for touring designers and mobile productions.",
      descriptionPt: "MagicQ Compact Connect é uma superfície de controlo USB leve e profissional que transforma qualquer PC ou Mac numa poderosa estação de iluminação. Possui 10 faders de reprodução, 8 codificadores de atributos e 2 saídas DMX diretas. Suportando 64 universos através da sua porta de rede integrada, oferece controlo tátil para iluminação, meios de comunicação e LEDs. Suficientemente pequeno para levar na bagagem de mão, inclui um hub USB interno e uma entrada de áudio, o que o torna a ferramenta ideal para designers em digressão e produções móveis.",
      categoryId: "cmk1e0n230003tb4gtbayc9jd",
      subcategoryId: "cmk2zfbje0047cw5gihy6kc4h",
      quantity: 1,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767727859432-ttpepgiuz.png",
      dailyRate: 250,
      type: "equipment",
      version: 1,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T19:31:00.026Z"),
      updatedAt: new Date("2026-01-06T19:31:00.026Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk2zmtp7004lcw5g4v3j31nk" },
    update: {},
    create: {
      id: "cmk2zmtp7004lcw5g4v3j31nk",
      name: "Stageworx Cable Bridge 2MC",
      description: "The Stageworx Cable Bridge 2MC is a heavy-duty, two-channel protector designed for high-traffic event environments. Featuring a high-visibility yellow hinged lid, it supports a maximum load of 3 tonnes, making it suitable for both pedestrian and light vehicle traffic. Each channel measures 3.2 x 3.2 cm, comfortably housing power and signal cables. This durable bridge ensures site safety and cable integrity during concerts, trade shows, and outdoor corporate events.",
      descriptionPt: "A ponte de cabos Stageworx 2MC é um protetor de dois canais para trabalhos pesados, concebido para ambientes de eventos com muito tráfego. Com uma tampa articulada amarela de alta visibilidade, suporta uma carga máxima de 3 toneladas, o que a torna adequada tanto para o tráfego de peões como de veículos ligeiros. Cada canal mede 3,2 x 3,2 cm, albergando confortavelmente cabos de alimentação e de sinal. Esta ponte duradoura garante a segurança do local e a integridade dos cabos durante concertos, feiras comerciais e eventos empresariais ao ar livre.",
      categoryId: "cmk2yg76g002xcw5gs5phwj4g",
      subcategoryId: "cmk2zm9g4004hcw5g0hmjrt3d",
      quantity: 12,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767728040013-905dct48g.jpg",
      dailyRate: 10,
      type: "equipment",
      version: 1,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T19:34:00.666Z"),
      updatedAt: new Date("2026-01-06T19:34:00.666Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk2zoyuz004pcw5gzjf3r2wh" },
    update: {},
    create: {
      id: "cmk2zoyuz004pcw5gzjf3r2wh",
      name: "Stageworx Cable Bridge 1S",
      description: "The Stageworx Cable Bridge 1S is an ultra-slim, professional cable protector designed for indoor use and light pedestrian traffic. It features a single 10 x 48 mm channel, perfect for discreetly managing power leads or XLR signal cables. With a load capacity of 200 kg and a total length of 90 cm, this non-slip bridge prevents tripping hazards while maintaining a low profile. Its lightweight 1.4 kg construction allows for rapid deployment and easy transport for small events and gallery spaces.",
      descriptionPt: "O Stageworx Cable Bridge 1S é um protetor de cabos profissional ultrafino, concebido para utilização em interiores e tráfego pedonal ligeiro. Possui um único canal de 10 x 48 mm, perfeito para gerir discretamente cabos de alimentação ou cabos de sinal XLR. Com uma capacidade de carga de 200 kg e um comprimento total de 90 cm, esta ponte antiderrapante evita os riscos de tropeçar, mantendo um perfil baixo. A sua construção leve de 1,4 kg permite uma utilização rápida e um transporte fácil para pequenos eventos e espaços de galeria.",
      categoryId: "cmk2yg76g002xcw5gs5phwj4g",
      subcategoryId: "cmk2zm9g4004hcw5g0hmjrt3d",
      quantity: 12,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767728140164-f0cog3gjv.jpg",
      dailyRate: 8,
      type: "equipment",
      version: 1,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T19:35:40.665Z"),
      updatedAt: new Date("2026-01-06T19:35:40.665Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk2zsxr2004vcw5gxpz4yjv1" },
    update: {},
    create: {
      id: "cmk2zsxr2004vcw5gxpz4yjv1",
      name: "Zoom H5 Handy Recorder",
      description: "The Zoom H5 is a versatile portable digital recorder featuring an interchangeable capsule system and four tracks of simultaneous recording. It comes standard with the XYH-5 X/Y microphone capsule, designed to handle up to 140 dB SPL for distortion-free audio. ",
      descriptionPt: "O Zoom H5 é um gravador digital portátil versátil que inclui um sistema de cápsulas intercambiáveis e quatro pistas de gravação simultânea. É fornecido de série com a cápsula de microfone XYH-5 X/Y, concebida para suportar até 140 dB SPL para um áudio sem distorção.",
      categoryId: "cmk1e0n260004tb4g37154d95",
      subcategoryId: "cmk2zsbnb004rcw5gpo2fybt8",
      quantity: 1,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767728325380-us7yb08bz.jpg",
      dailyRate: 40,
      type: "equipment",
      version: 1,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T19:38:45.854Z"),
      updatedAt: new Date("2026-01-06T19:38:45.854Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk2zv5y60051cw5gm6vusmve" },
    update: {},
    create: {
      id: "cmk2zv5y60051cw5gm6vusmve",
      name: "Global Truss F34200-B Truss 2,0m Black",
      description: "The Global Truss F34200-B is a professional 4-point square truss section with a sleek black powder-coated finish. This 2-meter straight segment features a 29 cm edge dimension, 50 mm main pipes, and 2 mm wall thickness. Designed for high visibility and aesthetic integration, it is TÜV certified for safety and includes conical connectors for rapid, secure assembly. It is ideal for corporate events, exhibitions, and stage designs requiring a premium, non-reflective look.",
      descriptionPt: "A Global Truss F34200-B é uma secção de treliça quadrada profissional de 4 pontos com um elegante acabamento revestido a pó preto. Este segmento reto de 2 metros apresenta uma dimensão de borda de 29 cm, tubos principais de 50 mm e espessura de parede de 2 mm. Concebida para uma elevada visibilidade e integração estética, possui certificação TÜV para segurança e inclui conectores cónicos para uma montagem rápida e segura. É ideal para eventos empresariais, exposições e projectos de palcos que exijam um aspeto de qualidade superior e não refletor.",
      categoryId: "cmk2yg76g002xcw5gs5phwj4g",
      subcategoryId: "cmk2zuebl004xcw5gs501q7p4",
      quantity: 6,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767728429078-jcvo3dzh1.jpg",
      dailyRate: 25,
      type: "equipment",
      version: 1,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T19:40:29.790Z"),
      updatedAt: new Date("2026-01-06T19:40:29.790Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk2zy3p10055cw5gjq6mz7hi" },
    update: {},
    create: {
      id: "cmk2zy3p10055cw5gjq6mz7hi",
      name: "Global Truss 27195 Baseplate Multi 80x80cm",
      description: "The Global Truss 27195 is a heavy-duty, multi-purpose steel baseplate designed for maximum stability of vertical truss columns. Weighing 36kg, this 80x80cm plate provides a low center of gravity for \"totem\" configurations. It features a versatile hole pattern compatible with Global Truss F23, F24, F33, and F34 systems. The black powder-coated finish ensures a professional, discreet appearance, while rounded corners enhance safety and ease of handling during load-ins.",
      descriptionPt: "A Global Truss 27195 é uma placa de base em aço para trabalhos pesados e polivalentes, concebida para a máxima estabilidade de colunas de treliça verticais. Pesando 36 kg, esta placa de 80x80 cm proporciona um centro de gravidade baixo para configurações de \"totem\". Apresenta um padrão de orifícios versátil compatível com os sistemas Global Truss F23, F24, F33 e F34. O acabamento revestido a pó preto garante uma aparência profissional e discreta, enquanto os cantos arredondados aumentam a segurança e a facilidade de manuseamento durante as cargas.",
      categoryId: "cmk2yg76g002xcw5gs5phwj4g",
      subcategoryId: "cmk2zuebl004xcw5gs501q7p4",
      quantity: 2,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767728566434-9786s18xh.jpg",
      dailyRate: 10,
      type: "equipment",
      version: 1,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T19:42:46.837Z"),
      updatedAt: new Date("2026-01-06T19:42:46.837Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk3007u20059cw5gndf55q8d" },
    update: {},
    create: {
      id: "cmk3007u20059cw5gndf55q8d",
      name: "Eurolite RF-300 Radial Wind Machine",
      description: "The Eurolite RF-300 is a powerful and quiet radial blower designed for creating focused air effects on stage and in studio environments. It features a sturdy, road-ready plastic housing with a built-in handle for easy transport. The air discharge angle is adjustable (0° or 45°) by repositioning the housing, and the unit delivers a maximum airflow of 510 m³/h. Compact and efficient, it is ideal for fashion shoots, theaters, and exhibitions requiring plug-and-play operation.",
      descriptionPt: "O Eurolite RF-300 é um potente e silencioso soprador radial concebido para criar efeitos de ar focados no palco e em ambientes de estúdio. Possui uma caixa de plástico robusta, preparada para a estrada, com uma pega incorporada para facilitar o transporte. O ângulo de descarga de ar é ajustável (0° ou 45°) através do reposicionamento da caixa, e a unidade fornece um caudal de ar máximo de 510 m³/h. Compacta e eficiente, é ideal para sessões fotográficas de moda, teatros e exposições que requerem um funcionamento \"plug-and-play\".",
      categoryId: "cmk1e0n230003tb4gtbayc9jd",
      subcategoryId: "cmk1ra3xh000qtjeh69nb1iod",
      quantity: 1,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767728665084-23eodp0fc.jpg",
      dailyRate: 15,
      type: "equipment",
      version: 1,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T19:44:25.514Z"),
      updatedAt: new Date("2026-01-06T19:44:25.514Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk3032mi005dcw5g4cvlohkc" },
    update: {},
    create: {
      id: "cmk3032mi005dcw5g4cvlohkc",
      name: "Global Truss F34C21-B 90° Corner Black",
      description: "The Global Truss F34C21-B is a professional 2-way 90-degree corner designed for the F34 square truss system. This 0.5-meter segment features a high-durability black powder-coated finish, specifically engineered for seamless architectural integration. Constructed from 50 mm main tubes with a 2 mm wall thickness, it includes all necessary conical connectors for a secure, load-bearing fit. It is the perfect solution for creating sleek, non-reflective truss boxes and stage frames.",
      descriptionPt: "O Global Truss F34C21-B é um canto profissional de 90 graus de 2 vias concebido para o sistema de treliça quadrada F34. Este segmento de 0,5 metros apresenta um acabamento revestido a pó preto de alta durabilidade, especificamente concebido para uma integração arquitetónica perfeita. Construído a partir de tubos principais de 50 mm com uma espessura de parede de 2 mm, inclui todos os conectores cónicos necessários para um encaixe seguro e de suporte de carga. É a solução perfeita para criar caixas de treliça e estruturas de palco elegantes e não reflectoras.",
      categoryId: "cmk2yg76g002xcw5gs5phwj4g",
      subcategoryId: "cmk2zuebl004xcw5gs501q7p4",
      quantity: 2,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767728798225-3zn718omf.jpg",
      dailyRate: 15,
      type: "equipment",
      version: 1,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T19:46:38.729Z"),
      updatedAt: new Date("2026-01-06T19:46:38.729Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk3070ja005jcw5gjjakzrmp" },
    update: {},
    create: {
      id: "cmk3070ja005jcw5gjjakzrmp",
      name: "Botex Power Splitter 32A CEE to Schuko/CEE Distribution Box",
      description: "The Botex Power Splitter 32 is a rugged 32A CEE three-phase power distributor designed for reliable stage and truss integration. It features a 32A CEE input and output (loop-through) and distributes power to six Schuko (230V) outlets. ",
      descriptionPt: "O Botex Power Splitter 32 é um distribuidor de energia trifásico CEE de 32A robusto, concebido para uma integração fiável em palcos e estruturas. Possui uma entrada e saída CEE de 32A (loop-through) e distribui energia para seis tomadas Schuko (230V).",
      categoryId: "cmk2xt5s50023cw5g2242d74c",
      subcategoryId: "cmk3062bl005fcw5g359snsxf",
      quantity: 1,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767728982139-050kjnqmw.jpg",
      dailyRate: 20,
      type: "equipment",
      version: 1,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T19:49:42.646Z"),
      updatedAt: new Date("2026-01-06T19:49:42.646Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk308q32005ncw5gv7rwx1zo" },
    update: {},
    create: {
      id: "cmk308q32005ncw5gv7rwx1zo",
      name: " Global Truss CC50403 Base Plate Steel 600mm",
      description: "The Global Truss CC50403 is a sleek, black powder-coated steel base plate measuring 600x600x5mm. Weighing approximately 13kg, it provides a stable and discreet foundation for pipe-and-drape systems or lightweight vertical truss totems. Its low-profile design is perfect for high-end events where safety and aesthetics are paramount, offering multiple mounting points for F22 through F34 truss systems and telescopic uprights.",
      descriptionPt: "A Global Truss CC50403 é uma placa de base de aço elegante, revestida a pó preto, que mede 600x600x5mm. Com um peso aproximado de 13 kg, proporciona uma base estável e discreta para sistemas de tubos e cordas ou totens de treliça verticais leves. O seu design de baixo perfil é perfeito para eventos de alta qualidade em que a segurança e a estética são fundamentais, oferecendo vários pontos de montagem para sistemas de treliça F22 a F34 e montantes telescópicos.",
      categoryId: "cmk2yg76g002xcw5gs5phwj4g",
      subcategoryId: "cmk2zuebl004xcw5gs501q7p4",
      quantity: 4,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767729061809-8jbq1v0j2.jpg",
      dailyRate: 15,
      type: "equipment",
      version: 1,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T19:51:02.413Z"),
      updatedAt: new Date("2026-01-06T19:51:02.413Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk30aj41005rcw5g6vz94vgn" },
    update: {},
    create: {
      id: "cmk30aj41005rcw5g6vz94vgn",
      name: "PCE Merz M-SVE3 63/121-9 Power Distributor",
      description: "PCE Merz M-SVE3 63/121-9 Power Distributot features a 63A CEE input and provides a comprehensive range of outputs: 1x CEE 63A, 2x CEE 32A, 1x CEE 16A, and 9x Schuko sockets. Equipped with dual 63A/0.03A RCDs and individual circuit breakers for all ports, this IP44-rated unit ensures maximum safety and high-load capacity for professional stage, event, and industrial power management.",
      descriptionPt: "O distribuidor de energia PCE Merz M-SVE3 63/121-9 possui uma entrada CEE 63A e fornece uma gama abrangente de saídas: 1x CEE 63A, 2x CEE 32A, 1x CEE 16A, e 9x tomadas Schuko. Equipada com dois RCDs de 63A/0,03A e disjuntores individuais para todas as portas, esta unidade com classificação IP44 garante a máxima segurança e uma elevada capacidade de carga para gestão profissional de energia em palcos, eventos e indústria.",
      categoryId: "cmk2xt5s50023cw5g2242d74c",
      subcategoryId: "cmk3062bl005fcw5g359snsxf",
      quantity: 1,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767729145962-ltek6fq5a.jpg",
      dailyRate: 50,
      type: "equipment",
      version: 1,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T19:52:26.689Z"),
      updatedAt: new Date("2026-01-06T19:52:26.689Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk31dumm0065cw5gxkklvhla" },
    update: {},
    create: {
      id: "cmk31dumm0065cw5gxkklvhla",
      name: "Traktor Kontrol Z1 ",
      description: "The Traktor Kontrol Z1 is an ultra-portable, professional 2-channel mixing controller, audio interface, and EQ system for Traktor Pro and Traktor DJ. It features high-quality faders, a 3-band EQ, and a dedicated filter section for each channel. The built-in 24-bit audio interface provides club-ready sound with a dedicated headphone cue. Its compact footprint makes it the perfect solution for mobile DJs and backup rigs, offering tactile control in a travel-friendly design.",
      descriptionPt: "O Traktor Kontrol Z1 é um controlador de mistura profissional ultra-portátil de 2 canais, interface de áudio e sistema de equalização para Traktor Pro e Traktor DJ. Inclui faders de alta qualidade, um equalizador de 3 bandas e uma secção de filtro dedicada para cada canal. A interface de áudio de 24 bits incorporada proporciona um som pronto para o clube com um sinal de auscultadores dedicado. O seu tamanho compacto faz com que seja a solução perfeita para DJs móveis e equipamentos de reserva, oferecendo controlo tátil num design fácil de transportar.",
      categoryId: "cmk1e0n260004tb4g37154d95",
      subcategoryId: "cmk2yn0840039cw5gavgf2wsn",
      quantity: 1,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767731812313-tobuvk1wq.jpg",
      dailyRate: 35,
      type: "equipment",
      version: 2,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T20:23:01.197Z"),
      updatedAt: new Date("2026-01-06T20:36:52.320Z"),
    },
  });

  await prisma.equipmentitem.upsert({
    where: { id: "cmk31jx8y0069cw5gqgp3x3k3" },
    update: {},
    create: {
      id: "cmk31jx8y0069cw5gqgp3x3k3",
      name: "Custom 32A  Power Distributor (Modified)",
      description: "It features a 32A CEE 5-pin input for high-capacity power handling, delivering energy through four standard 16A Schuko outlets and two IEC C13 ports. Housed in a durable, impact-resistant ABS casing with an IP44 protection rating, the unit includes an integrated circuit breaker to ensure safe operation. It is an essential tool for providing localized power drops to stage equipment and production desks.",
      descriptionPt: "Possui uma entrada de 32A CEE de 5 pinos para uma elevada capacidade de manuseamento de energia, fornecendo energia através de quatro tomadas Schuko de 16A padrão e duas portas IEC C13. Alojada numa caixa de ABS durável e resistente a impactos com uma classificação de proteção IP44, a unidade inclui um disjuntor integrado para garantir um funcionamento seguro. É uma ferramenta essencial para fornecer quedas de energia localizadas a equipamentos de palco e mesas de produção.",
      categoryId: "cmk2xt5s50023cw5g2242d74c",
      subcategoryId: "cmk3062bl005fcw5g359snsxf",
      quantity: 0,
      status: "good",
      location: "Warehouse A",
      imageUrl: "/images/equipment-1767731263992-ey9ca664y.png",
      dailyRate: 0,
      type: "equipment",
      version: 1,
      createdBy: "cmk2tl2690000o85xlet8yxg7",
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T20:27:44.529Z"),
      updatedAt: new Date("2026-01-06T20:27:44.529Z"),
    },
  });
    console.log("✅ Equipment Items seeded");

    // 4️⃣ Seed Partners
    console.log("🤝 Seeding Partners...");
  await prisma.partner.upsert({
    where: { id: "cmk1e0n150000tb4g9cktv4bk" },
    update: {},
    create: {
      id: "cmk1e0n150000tb4g9cktv4bk",
      name: "Rey Davis",
      companyName: "VRD Production",
      contactPerson: null,
      email: "hello@vrd.productions",
      phone: "351969774999",
      address: null,
      website: "https://vrd.productions",
      notes: "Professional Audio Visual Equipment Rental",
      clientId: null,
      partnerType: "agency",
      commission: null,
      isActive: true,
      logoUrl: "",
      version: 1,
      createdBy: null,
      updatedBy: "cmk2tl2690000o85xlet8yxg7",
      createdAt: new Date("2026-01-06T16:55:54.014Z"),
      updatedAt: new Date("2026-01-06T20:27:56.570Z"),
    },
  });
    console.log("✅ Partners seeded");

    // 5️⃣ Seed Clients (may reference Partners)
    console.log("👥 Seeding Clients...");
  await prisma.client.upsert({
    where: { id: "cmk1e0n1r0002tb4gjb98wkjn" },
    update: {},
    create: {
      id: "cmk1e0n1r0002tb4gjb98wkjn",
      name: "Rey Davis",
      contactPerson: "Rey Davis Team",
      email: "hello@vrd.productions",
      phone: "351969774999",
      address: "VRD Production",
      notes: "Professional Audio Visual Equipment Rental Provider",
      taxId: null,
      partnerId: "cmk1e0n150000tb4g9cktv4bk",
      version: 1,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date("2026-01-06T16:55:54.018Z"),
      updatedAt: new Date("2026-01-06T16:55:54.018Z"),
    },
  });
    console.log("✅ Clients seeded");

    console.log("\n✨ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
