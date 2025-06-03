#!/usr/bin/env tsx

import { ServiceConfigBaseSchema, type ServiceConfigBase } from '@treksistem/shared-types';
import { createId } from '@paralleldrive/cuid2';

/**
 * Demo Account Configuration
 */
const DEMO_CONFIG = {
  mitra: {
    ownerUserId: 'demo@treksistem.sandbox',
    name: 'Treksistem Demo Mitra',
  },
  services: [
    {
      name: 'Speedy Bike Courier (Demo)',
      serviceTypeKey: 'MOTOR_P2P_EXPRESS',
      configJson: {
        serviceTypeAlias: 'Ojek Express Demo',
        modelBisnis: 'PUBLIC_3RD_PARTY',
        angkutanUtama: 'MOTOR',
        driverGenderConstraint: 'SEMUA',
        modelRute: 'DYNAMIC_P2P',
        privasiMassal: 'PRIVATE_SINGLE_ORDER',
        waktuLayananDefault: 'EXPRESS_NOW',
        allowedModelOrder: ['PANGGIL_KE_ORDERER'],
        penanggungJawabOrder: 'KETEMU_LANGSUNG',
        fiturTalangan: {
          enabled: true,
          maxAmount: 50000,
        },
        alurLayanan: 'DIRECT_PICKUP_DELIVER',
        isBarangPentingDefault: false,
        jangkauanLayanan: {
          maxDistanceKm: 15,
          kotaCoverage: ['Malang Kota', 'Kab Malang'],
        },
        pricing: {
          biayaAdminPerOrder: 2000,
          modelHargaJarak: 'PER_KM',
          biayaPerKm: 3500,
        },
        allowedMuatan: [
          {
            muatanId: 'PENUMPANG',
            namaTampil: 'Penumpang',
            biayaHandlingTambahan: 0,
          },
        ],
        availableFasilitas: [
          {
            fasilitasId: 'HELM',
            namaTampil: 'Helm',
            biayaFasilitasTambahan: 0,
          },
        ],
      } as ServiceConfigBase,
    },
    {
      name: 'Lunchbox Delivery (Demo)',
      serviceTypeKey: 'MOTOR_FOOD_COURIER',
      configJson: {
        serviceTypeAlias: 'Kurir Makanan Demo',
        modelBisnis: 'PUBLIC_3RD_PARTY',
        angkutanUtama: 'MOTOR',
        driverGenderConstraint: 'SEMUA',
        modelRute: 'DYNAMIC_P2P',
        privasiMassal: 'PRIVATE_SINGLE_ORDER',
        waktuLayananDefault: 'EXPRESS_NOW',
        allowedModelOrder: ['AMBIL_ANTAR_ORDERER'],
        penanggungJawabOrder: 'DIWAKILKAN',
        fiturTalangan: {
          enabled: true,
          maxAmount: 75000,
        },
        alurLayanan: 'DIRECT_PICKUP_DELIVER',
        isBarangPentingDefault: false,
        jangkauanLayanan: {
          maxDistanceKm: 10,
          kotaCoverage: ['Malang Kota'],
        },
        pricing: {
          biayaAdminPerOrder: 1500,
          modelHargaJarak: 'PER_KM',
          biayaPerKm: 2500,
        },
        allowedMuatan: [
          {
            muatanId: 'PAKET_MAKANAN',
            namaTampil: 'Paket Makanan',
            biayaHandlingTambahan: 0,
          },
          {
            muatanId: 'MINUMAN',
            namaTampil: 'Minuman',
            biayaHandlingTambahan: 0,
          },
        ],
        availableFasilitas: [
          {
            fasilitasId: 'TAS_PENGHANGAT',
            namaTampil: 'Tas Penghangat Makanan',
            biayaFasilitasTambahan: 0,
          },
        ],
      } as ServiceConfigBase,
    },
    {
      name: 'AnJem Anak Sekolah (Demo)',
      serviceTypeKey: 'MOBIL_ANJEM_BASIC',
      configJson: {
        serviceTypeAlias: 'Antar Jemput Sekolah Demo',
        modelBisnis: 'PUBLIC_3RD_PARTY',
        angkutanUtama: 'MOBIL',
        driverGenderConstraint: 'SEMUA',
        modelRute: 'DYNAMIC_P2P',
        privasiMassal: 'MASSAL_MULTI_ORDER',
        waktuLayananDefault: 'SCHEDULED_TIME',
        allowedModelOrder: ['JEMPUT_ANTAR_LAIN'],
        penanggungJawabOrder: 'KETEMU_LANGSUNG',
        fiturTalangan: {
          enabled: false,
        },
        alurLayanan: 'DIRECT_PICKUP_DELIVER',
        isBarangPentingDefault: false,
        jangkauanLayanan: {
          maxDistanceKm: 20,
          kotaCoverage: ['Malang Kota', 'Kab Malang'],
        },
        pricing: {
          biayaAdminPerOrder: 3000,
          modelHargaJarak: 'PER_KM',
          biayaPerKm: 4000,
          modelHargaMuatanPcs: 'PER_PCS',
          biayaPerPcs: 15000,
        },
        allowedMuatan: [
          {
            muatanId: 'PENUMPANG',
            namaTampil: 'Anak Sekolah',
            biayaHandlingTambahan: 0,
          },
        ],
        availableFasilitas: [
          {
            fasilitasId: 'AC',
            namaTampil: 'Air Conditioning',
            biayaFasilitasTambahan: 0,
          },
          {
            fasilitasId: 'WIFI',
            namaTampil: 'WiFi',
            biayaFasilitasTambahan: 5000,
          },
        ],
      } as ServiceConfigBase,
    },
  ],
  drivers: [
    {
      identifier: 'driver-budi-demo',
      name: 'Pak Budi (Demo)',
      configJson: {
        vehicleType: 'MOTOR',
        vehicleCapacity: 1,
        specialCapabilities: ['HELM_EXTRA'],
      },
    },
    {
      identifier: 'driver-siti-demo',
      name: 'Ibu Siti (Demo)',
      configJson: {
        vehicleType: 'MOTOR',
        vehicleCapacity: 1,
        specialCapabilities: ['TAS_PENGHANGAT', 'COOLER_BOX'],
      },
    },
    {
      identifier: 'driver-eko-demo',
      name: 'Mas Eko (Demo)',
      configJson: {
        vehicleType: 'MOBIL',
        vehicleCapacity: 6,
        specialCapabilities: ['AC', 'WIFI', 'CHILD_SEAT'],
      },
    },
  ],
  sampleOrders: [
    {
      ordererIdentifier: '+6281234567890',
      receiverWaNumber: '+6281234567891',
      detailsJson: {
        pickupAddress: {
          address: 'Jl. Veteran No. 10, Malang',
          coordinates: { lat: -7.9666, lng: 112.6326 },
        },
        dropoffAddress: {
          address: 'Jl. Ijen No. 25, Malang',
          coordinates: { lat: -7.9553, lng: 112.6175 },
        },
        notes: 'Demo order - Ojek ke kampus',
        selectedMuatan: ['PENUMPANG'],
        selectedFasilitas: ['HELM'],
      },
      status: 'ASSIGNED',
      estimatedCost: 15000,
    },
    {
      ordererIdentifier: '+6281234567892',
      receiverWaNumber: '+6281234567893',
      detailsJson: {
        pickupAddress: {
          address: 'Warung Makan Sederhana, Jl. Kawi No. 5',
          coordinates: { lat: -7.9755, lng: 112.6244 },
        },
        dropoffAddress: {
          address: 'Perumahan Griya Shanta, Blok B-12',
          coordinates: { lat: -7.9445, lng: 112.6089 },
        },
        notes: 'Demo order - Pesan nasi gudeg + es teh',
        selectedMuatan: ['PAKET_MAKANAN', 'MINUMAN'],
        selectedFasilitas: ['TAS_PENGHANGAT'],
        talanganAmount: 25000,
      },
      status: 'IN_TRANSIT',
      estimatedCost: 18500,
    },
    {
      ordererIdentifier: '+6281234567894',
      detailsJson: {
        pickupAddress: {
          address: 'Rumah Budi, Jl. Mawar No. 15',
          coordinates: { lat: -7.9333, lng: 112.6444 },
        },
        dropoffAddress: {
          address: 'SD Negeri 1 Malang, Jl. Pendidikan',
          coordinates: { lat: -7.9777, lng: 112.6111 },
        },
        notes: 'Demo order - Antar anak sekolah pagi',
        selectedMuatan: ['PENUMPANG'],
        selectedFasilitas: ['AC'],
        scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      status: 'PENDING',
      estimatedCost: 28000,
    },
  ],
};

/**
 * Generate unique IDs for demo entities
 */
function generateDemoIds() {
  const mitraId = createId();
  const serviceIds = DEMO_CONFIG.services.map(() => createId());
  const driverIds = DEMO_CONFIG.drivers.map(() => createId());
  const orderIds = DEMO_CONFIG.sampleOrders.map(() => createId());

  return {
    mitraId,
    serviceIds,
    driverIds,
    orderIds,
  };
}

/**
 * Validate all service configurations
 */
function validateServiceConfigs(): void {
  console.log('🔍 Validating demo service configurations...');

  for (const service of DEMO_CONFIG.services) {
    try {
      ServiceConfigBaseSchema.parse(service.configJson);
      console.log(`✅ Service "${service.name}" configuration is valid`);
    } catch (error) {
      console.error(`❌ Service "${service.name}" configuration is invalid:`, error);
      process.exit(1);
    }
  }

  console.log('✅ All service configurations are valid!\n');
}

/**
 * Generate SQL INSERT statements for demo data
 */
function generateDemoDataSQL(): string {
  const ids = generateDemoIds();
  const sqlStatements: string[] = [];

  // Insert demo Mitra
  const mitraSQL = `INSERT INTO mitras (
  id, 
  owner_user_id, 
  name, 
  created_at, 
  updated_at
) VALUES (
  '${ids.mitraId}',
  '${DEMO_CONFIG.mitra.ownerUserId}',
  '${DEMO_CONFIG.mitra.name.replace(/'/g, "''")}',
  (unixepoch('subsec') * 1000),
  (unixepoch('subsec') * 1000)
) ON CONFLICT(owner_user_id) DO UPDATE SET
  name = excluded.name,
  updated_at = (unixepoch('subsec') * 1000);`;

  sqlStatements.push(mitraSQL);

  // Insert demo Services
  DEMO_CONFIG.services.forEach((service, index) => {
    const configJsonStr = JSON.stringify(service.configJson).replace(/'/g, "''");

    const serviceSQL = `INSERT INTO services (
  id,
  mitra_id,
  name,
  service_type_key,
  config_json,
  is_active,
  created_at,
  updated_at
) VALUES (
  '${ids.serviceIds[index]}',
  '${ids.mitraId}',
  '${service.name.replace(/'/g, "''")}',
  '${service.serviceTypeKey}',
  '${configJsonStr}',
  1,
  (unixepoch('subsec') * 1000),
  (unixepoch('subsec') * 1000)
) ON CONFLICT(id) DO UPDATE SET
  name = excluded.name,
  service_type_key = excluded.service_type_key,
  config_json = excluded.config_json,
  is_active = excluded.is_active,
  updated_at = (unixepoch('subsec') * 1000);`;

    sqlStatements.push(serviceSQL);
  });

  // Insert demo Drivers
  DEMO_CONFIG.drivers.forEach((driver, index) => {
    const configJsonStr = JSON.stringify(driver.configJson).replace(/'/g, "''");

    const driverSQL = `INSERT INTO drivers (
  id,
  mitra_id,
  identifier,
  name,
  config_json,
  is_active,
  created_at,
  updated_at
) VALUES (
  '${ids.driverIds[index]}',
  '${ids.mitraId}',
  '${driver.identifier}',
  '${driver.name.replace(/'/g, "''")}',
  '${configJsonStr}',
  1,
  (unixepoch('subsec') * 1000),
  (unixepoch('subsec') * 1000)
) ON CONFLICT(mitra_id, identifier) DO UPDATE SET
  name = excluded.name,
  config_json = excluded.config_json,
  is_active = excluded.is_active,
  updated_at = (unixepoch('subsec') * 1000);`;

    sqlStatements.push(driverSQL);
  });

  // Insert driver-service assignments
  const driverServiceAssignments = [
    { driverIndex: 0, serviceIndex: 0 }, // Pak Budi -> Speedy Bike Courier
    { driverIndex: 1, serviceIndex: 1 }, // Ibu Siti -> Lunchbox Delivery
    { driverIndex: 2, serviceIndex: 2 }, // Mas Eko -> AnJem Anak Sekolah
  ];

  driverServiceAssignments.forEach(({ driverIndex, serviceIndex }) => {
    const assignmentSQL = `INSERT INTO driver_services (
  driver_id,
  service_id
) VALUES (
  '${ids.driverIds[driverIndex]}',
  '${ids.serviceIds[serviceIndex]}'
) ON CONFLICT(driver_id, service_id) DO NOTHING;`;

    sqlStatements.push(assignmentSQL);
  });

  // Insert sample Orders
  DEMO_CONFIG.sampleOrders.forEach((order, index) => {
    const detailsJsonStr = JSON.stringify(order.detailsJson).replace(/'/g, "''");
    const receiverWaStr = order.receiverWaNumber ? `'${order.receiverWaNumber}'` : 'NULL';

    // Assign orders to appropriate services and drivers
    const serviceIndex = index % DEMO_CONFIG.services.length;
    const driverIndex = order.status === 'PENDING' ? null : index % DEMO_CONFIG.drivers.length;
    const driverIdStr = driverIndex !== null ? `'${ids.driverIds[driverIndex]}'` : 'NULL';

    const orderSQL = `INSERT INTO orders (
  id,
  service_id,
  mitra_id,
  driver_id,
  orderer_identifier,
  receiver_wa_number,
  details_json,
  status,
  estimated_cost,
  created_at,
  updated_at
) VALUES (
  '${ids.orderIds[index]}',
  '${ids.serviceIds[serviceIndex]}',
  '${ids.mitraId}',
  ${driverIdStr},
  '${order.ordererIdentifier}',
  ${receiverWaStr},
  '${detailsJsonStr}',
  '${order.status}',
  ${order.estimatedCost},
  (unixepoch('subsec') * 1000),
  (unixepoch('subsec') * 1000)
) ON CONFLICT(id) DO UPDATE SET
  status = excluded.status,
  driver_id = excluded.driver_id,
  updated_at = (unixepoch('subsec') * 1000);`;

    sqlStatements.push(orderSQL);

    // Add order events for non-pending orders
    if (order.status !== 'PENDING') {
      const eventId = createId();
      const eventSQL = `INSERT INTO order_events (
  id,
  order_id,
  timestamp,
  event_type,
  data_json,
  actor_type,
  actor_id
) VALUES (
  '${eventId}',
  '${ids.orderIds[index]}',
  (unixepoch('subsec') * 1000),
  'STATUS_UPDATE',
  '{"old_status": "PENDING", "new_status": "${order.status}", "reason": "Demo data seeding"}',
  'SYSTEM',
  'demo-seeder'
) ON CONFLICT(id) DO NOTHING;`;

      sqlStatements.push(eventSQL);
    }
  });

  return sqlStatements.join('\n\n');
}

/**
 * Generate cleanup SQL to remove existing demo data
 */
function generateCleanupSQL(): string {
  return `-- Cleanup existing demo data
DELETE FROM order_events WHERE order_id IN (
  SELECT id FROM orders WHERE mitra_id IN (
    SELECT id FROM mitras WHERE owner_user_id = '${DEMO_CONFIG.mitra.ownerUserId}'
  )
);

DELETE FROM orders WHERE mitra_id IN (
  SELECT id FROM mitras WHERE owner_user_id = '${DEMO_CONFIG.mitra.ownerUserId}'
);

DELETE FROM driver_services WHERE driver_id IN (
  SELECT id FROM drivers WHERE mitra_id IN (
    SELECT id FROM mitras WHERE owner_user_id = '${DEMO_CONFIG.mitra.ownerUserId}'
  )
);

DELETE FROM drivers WHERE mitra_id IN (
  SELECT id FROM mitras WHERE owner_user_id = '${DEMO_CONFIG.mitra.ownerUserId}'
);

DELETE FROM services WHERE mitra_id IN (
  SELECT id FROM mitras WHERE owner_user_id = '${DEMO_CONFIG.mitra.ownerUserId}'
);

DELETE FROM mitras WHERE owner_user_id = '${DEMO_CONFIG.mitra.ownerUserId}';`;
}

/**
 * Main execution function
 */
function main(): void {
  console.log('🌱 Treksistem Demo Account Seeding Script\n');
  console.log(`📧 Demo Account: ${DEMO_CONFIG.mitra.ownerUserId}`);
  console.log(`🏢 Demo Mitra: ${DEMO_CONFIG.mitra.name}`);
  console.log(`🚗 Services: ${DEMO_CONFIG.services.length}`);
  console.log(`👨‍💼 Drivers: ${DEMO_CONFIG.drivers.length}`);
  console.log(`📦 Sample Orders: ${DEMO_CONFIG.sampleOrders.length}\n`);

  // Validate all service configurations
  validateServiceConfigs();

  // Generate cleanup SQL
  console.log('🧹 Generating cleanup SQL...');
  const cleanupSQL = generateCleanupSQL();

  // Generate demo data SQL
  console.log('📝 Generating demo data SQL...');
  const demoDataSQL = generateDemoDataSQL();

  const fullSQL = `${cleanupSQL}\n\n-- Insert demo data\n${demoDataSQL}`;

  console.log('📄 Generated SQL for seeding demo account:');
  console.log('='.repeat(80));
  console.log(fullSQL);
  console.log('='.repeat(80));

  console.log('\n🚀 To apply these changes to staging:');
  console.log('1. Copy the SQL above to a file (e.g., seed-demo.sql)');
  console.log(
    '2. Run: wrangler d1 execute TREKSISTEM_DB --env staging --remote --file=seed-demo.sql',
  );
  console.log('\n📋 Demo Account Access Instructions:');
  console.log(`• Email: ${DEMO_CONFIG.mitra.ownerUserId}`);
  console.log('• Configure Cloudflare Access to allow this email');
  console.log('• Users can log in to staging Mitra Admin frontend');
  console.log('• Demo services will be available for testing orders');

  console.log('\n✨ Demo seeding script completed successfully!');
}

// Execute if run directly
if (require.main === module) {
  main();
}

export { DEMO_CONFIG, generateDemoDataSQL, generateCleanupSQL };
