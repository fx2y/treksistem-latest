#!/usr/bin/env tsx

import { ServiceConfigBaseSchema, type ServiceConfigBase } from '@treksistem/shared-types';

/**
 * Master Service Template Definition
 */
interface MasterServiceTemplate {
  id: string;
  name: string;
  description: string;
  appliesToServiceTypeKey: string;
  configJson: ServiceConfigBase;
  sortOrder: number;
}

/**
 * Master Service Templates Data
 * These templates provide starting points for Mitras to create their services
 */
const masterTemplates: MasterServiceTemplate[] = [
  {
    id: 'MOTOR_P2P_STD_TPL',
    name: 'Standard Motorcycle Taxi (Ojek)',
    description: 'A template for standard point-to-point motorcycle taxi services with passenger transport.',
    appliesToServiceTypeKey: 'MOTOR_P2P_EXPRESS',
    sortOrder: 1,
    configJson: {
      serviceTypeAlias: "Ojek Standard",
      modelBisnis: "PUBLIC_3RD_PARTY",
      angkutanUtama: "MOTOR",
      driverGenderConstraint: "SEMUA",
      modelRute: "DYNAMIC_P2P",
      privasiMassal: "PRIVATE_SINGLE_ORDER",
      waktuLayananDefault: "EXPRESS_NOW",
      allowedModelOrder: ["PANGGIL_KE_ORDERER"],
      penanggungJawabOrder: "KETEMU_LANGSUNG",
      fiturTalangan: {
        enabled: false
      },
      alurLayanan: "DIRECT_PICKUP_DELIVER",
      isBarangPentingDefault: false,
      jangkauanLayanan: {
        maxDistanceKm: 15,
        kotaCoverage: ["Malang Kota", "Kab Malang"]
      },
      pricing: {
        biayaAdminPerOrder: 2000,
        modelHargaJarak: "PER_KM",
        biayaPerKm: 3000
      },
      allowedMuatan: [
        {
          muatanId: "PENUMPANG",
          namaTampil: "Penumpang",
          biayaHandlingTambahan: 0
        }
      ],
      availableFasilitas: [
        {
          fasilitasId: "HELM",
          namaTampil: "Helm",
          biayaFasilitasTambahan: 0
        }
      ]
    }
  },
  {
    id: 'MOTOR_FOOD_DELIVERY_TPL',
    name: 'Food Delivery Courier',
    description: 'A template for motorcycle-based food delivery services with insulated bags.',
    appliesToServiceTypeKey: 'MOTOR_FOOD_COURIER',
    sortOrder: 2,
    configJson: {
      serviceTypeAlias: "Kurir Makanan",
      modelBisnis: "PUBLIC_3RD_PARTY",
      angkutanUtama: "MOTOR",
      driverGenderConstraint: "SEMUA",
      modelRute: "DYNAMIC_P2P",
      privasiMassal: "PRIVATE_SINGLE_ORDER",
      waktuLayananDefault: "EXPRESS_NOW",
      allowedModelOrder: ["AMBIL_ANTAR_ORDERER"],
      penanggungJawabOrder: "DIWAKILKAN",
      fiturTalangan: {
        enabled: true,
        maxAmount: 100000
      },
      alurLayanan: "DIRECT_PICKUP_DELIVER",
      isBarangPentingDefault: false,
      jangkauanLayanan: {
        maxDistanceKm: 10,
        kotaCoverage: ["Malang Kota"]
      },
      pricing: {
        biayaAdminPerOrder: 1500,
        modelHargaJarak: "PER_KM",
        biayaPerKm: 2500
      },
      allowedMuatan: [
        {
          muatanId: "PAKET_MAKANAN",
          namaTampil: "Paket Makanan",
          biayaHandlingTambahan: 0
        },
        {
          muatanId: "MINUMAN",
          namaTampil: "Minuman",
          biayaHandlingTambahan: 0
        }
      ],
      availableFasilitas: [
        {
          fasilitasId: "TAS_PENGHANGAT",
          namaTampil: "Tas Penghangat Makanan",
          biayaFasilitasTambahan: 0
        }
      ]
    }
  },
  {
    id: 'MOTOR_PACKAGE_COURIER_TPL',
    name: 'Package Courier Service',
    description: 'A template for general package delivery services using motorcycles.',
    appliesToServiceTypeKey: 'MOTOR_PACKAGE_COURIER',
    sortOrder: 3,
    configJson: {
      serviceTypeAlias: "Kurir Paket",
      modelBisnis: "PUBLIC_3RD_PARTY",
      angkutanUtama: "MOTOR",
      driverGenderConstraint: "SEMUA",
      modelRute: "DYNAMIC_P2P",
      privasiMassal: "PRIVATE_SINGLE_ORDER",
      waktuLayananDefault: "EXPRESS_NOW",
      allowedModelOrder: ["AMBIL_ANTAR_ORDERER", "JEMPUT_ANTAR_LAIN"],
      penanggungJawabOrder: "DIWAKILKAN",
      fiturTalangan: {
        enabled: true,
        maxAmount: 200000
      },
      alurLayanan: "DIRECT_PICKUP_DELIVER",
      isBarangPentingDefault: true,
      jangkauanLayanan: {
        maxDistanceKm: 20,
        kotaCoverage: ["Malang Kota", "Kab Malang", "Batu"]
      },
      pricing: {
        biayaAdminPerOrder: 2500,
        modelHargaJarak: "PER_KM",
        biayaPerKm: 3500
      },
      allowedMuatan: [
        {
          muatanId: "PAKET_KECIL",
          namaTampil: "Paket Kecil (< 5kg)",
          biayaHandlingTambahan: 0
        },
        {
          muatanId: "DOKUMEN",
          namaTampil: "Dokumen Penting",
          biayaHandlingTambahan: 1000
        }
      ],
      availableFasilitas: [
        {
          fasilitasId: "BOX_PENGAMAN",
          namaTampil: "Box Pengaman",
          biayaFasilitasTambahan: 2000
        }
      ]
    }
  },
  {
    id: 'MOBIL_ANJEM_BASIC_TPL',
    name: 'Basic Car Shuttle Service',
    description: 'A template for basic car-based shuttle services for multiple passengers.',
    appliesToServiceTypeKey: 'MOBIL_ANJEM_BASIC',
    sortOrder: 4,
    configJson: {
      serviceTypeAlias: "Antar Jemput Mobil",
      modelBisnis: "PUBLIC_3RD_PARTY",
      angkutanUtama: "MOBIL",
      driverGenderConstraint: "SEMUA",
      modelRute: "DYNAMIC_P2P",
      privasiMassal: "MASSAL_MULTI_ORDER",
      waktuLayananDefault: "SCHEDULED_TIME",
      allowedModelOrder: ["JEMPUT_ANTAR_LAIN"],
      penanggungJawabOrder: "KETEMU_LANGSUNG",
      fiturTalangan: {
        enabled: false
      },
      alurLayanan: "DIRECT_PICKUP_DELIVER",
      isBarangPentingDefault: false,
      jangkauanLayanan: {
        maxDistanceKm: 25,
        kotaCoverage: ["Malang Kota", "Kab Malang", "Batu"]
      },
      pricing: {
        biayaAdminPerOrder: 3000,
        modelHargaJarak: "PER_KM",
        biayaPerKm: 4000,
        modelHargaMuatanPcs: "PER_PCS",
        biayaPerPcs: 15000
      },
      allowedMuatan: [
        {
          muatanId: "PENUMPANG",
          namaTampil: "Penumpang",
          biayaHandlingTambahan: 0
        }
      ],
      availableFasilitas: [
        {
          fasilitasId: "AC",
          namaTampil: "Air Conditioning",
          biayaFasilitasTambahan: 0
        },
        {
          fasilitasId: "WIFI",
          namaTampil: "WiFi",
          biayaFasilitasTambahan: 5000
        }
      ]
    }
  },
  {
    id: 'AMBULANCE_TRANSPORT_TPL',
    name: 'Non-Emergency Ambulance Transport',
    description: 'A template for non-emergency medical transport services with basic medical equipment.',
    appliesToServiceTypeKey: 'AMBULANCE_TRANSPORT',
    sortOrder: 5,
    configJson: {
      serviceTypeAlias: "Ambulance Transport",
      modelBisnis: "USAHA_SENDIRI",
      angkutanUtama: "AMBULANCE",
      driverGenderConstraint: "SEMUA",
      modelRute: "DYNAMIC_P2P",
      privasiMassal: "PRIVATE_SINGLE_ORDER",
      waktuLayananDefault: "SCHEDULED_TIME",
      allowedModelOrder: ["JEMPUT_ANTAR_LAIN"],
      penanggungJawabOrder: "KETEMU_LANGSUNG",
      fiturTalangan: {
        enabled: false
      },
      alurLayanan: "DIRECT_PICKUP_DELIVER",
      isBarangPentingDefault: true,
      jangkauanLayanan: {
        maxDistanceKm: 50,
        kotaCoverage: ["Malang Kota", "Kab Malang", "Batu", "Pasuruan"]
      },
      pricing: {
        biayaAdminPerOrder: 5000,
        modelHargaJarak: "PER_KM",
        biayaPerKm: 8000
      },
      allowedMuatan: [
        {
          muatanId: "PASIEN_SAKIT",
          namaTampil: "Pasien Sakit",
          biayaHandlingTambahan: 0
        }
      ],
      availableFasilitas: [
        {
          fasilitasId: "KURSI_RODA_TRANSPORT",
          namaTampil: "Kursi Roda (Transport)",
          biayaFasilitasTambahan: 10000
        },
        {
          fasilitasId: "P3K_DASAR",
          namaTampil: "P3K Dasar",
          biayaFasilitasTambahan: 0
        },
        {
          fasilitasId: "OKSIGEN_PORTABLE",
          namaTampil: "Oksigen Portable",
          biayaFasilitasTambahan: 25000
        }
      ],
      typeSpecificConfig: {
        type: "AMBULANCE",
        config: {
          isEmergencyService: false,
          medicalEquipmentLevel: "BASIC",
          medicalPersonnelAvailable: ["PARAMEDIC"]
        }
      }
    }
  }
];

/**
 * Validate all templates against the schema
 */
function validateTemplates(): void {
  console.log('🔍 Validating master service templates...');
  
  for (const template of masterTemplates) {
    try {
      ServiceConfigBaseSchema.parse(template.configJson);
      console.log(`✅ Template "${template.name}" is valid`);
    } catch (error) {
      console.error(`❌ Template "${template.name}" is invalid:`, error);
      process.exit(1);
    }
  }
  
  console.log('✅ All templates are valid!\n');
}

/**
 * Generate SQL INSERT statements for the templates
 */
function generateSQLInserts(): string {
  const sqlStatements: string[] = [];
  
  for (const template of masterTemplates) {
    const configJsonStr = JSON.stringify(template.configJson).replace(/'/g, "''");
    const descriptionStr = template.description ? `'${template.description.replace(/'/g, "''")}'` : 'NULL';
    
    const sql = `INSERT INTO master_service_templates (
  id, 
  name, 
  description, 
  applies_to_service_type_key, 
  config_json, 
  sort_order,
  created_at,
  updated_at
) VALUES (
  '${template.id}',
  '${template.name.replace(/'/g, "''")}',
  ${descriptionStr},
  '${template.appliesToServiceTypeKey}',
  '${configJsonStr}',
  ${template.sortOrder},
  (unixepoch('subsec') * 1000),
  (unixepoch('subsec') * 1000)
) ON CONFLICT(id) DO UPDATE SET
  name = excluded.name,
  description = excluded.description,
  applies_to_service_type_key = excluded.applies_to_service_type_key,
  config_json = excluded.config_json,
  sort_order = excluded.sort_order,
  updated_at = (unixepoch('subsec') * 1000);`;
    
    sqlStatements.push(sql);
  }
  
  return sqlStatements.join('\n\n');
}

/**
 * Main execution function
 */
function main(): void {
  console.log('🌱 Master Service Templates Seeding Script\n');
  
  // Validate all templates
  validateTemplates();
  
  // Generate SQL
  console.log('📝 Generating SQL INSERT statements...');
  const sqlContent = generateSQLInserts();
  
  console.log('📄 Generated SQL for seeding master service templates:');
  console.log('=' .repeat(80));
  console.log(sqlContent);
  console.log('=' .repeat(80));
  
  console.log('\n🚀 To apply these changes:');
  console.log('1. Copy the SQL above to a file (e.g., seed-templates.sql)');
  console.log('2. Run: wrangler d1 execute TREKSISTEM_DB --local --file=seed-templates.sql');
  console.log('3. For production: wrangler d1 execute TREKSISTEM_DB --file=seed-templates.sql');
  
  console.log('\n✨ Seeding script completed successfully!');
}

// Execute if run directly
if (require.main === module) {
  main();
} 