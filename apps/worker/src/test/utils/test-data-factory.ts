import { createId } from '@paralleldrive/cuid2';
import type { CreateServicePayload, ServiceConfigBase } from '@treksistem/shared-types';

/**
 * Test Data Factory for Mitra API Testing
 *
 * Generates valid and invalid test data for comprehensive API testing,
 * including edge cases and complex configurations.
 */
export class TestDataFactory {
  /**
   * Create a valid service payload for testing
   */
  createValidServicePayload(): CreateServicePayload {
    return {
      name: 'Ojek Cepat Test Service',
      serviceTypeKey: 'P2P_EXPRESS_MOTOR',
      isActive: true,
      configJson: this.createValidServiceConfig(),
    };
  }

  /**
   * Create a valid service configuration
   */
  createValidServiceConfig(): ServiceConfigBase {
    return {
      serviceTypeAlias: 'Ojek Express',
      modelBisnis: 'USAHA_SENDIRI',
      angkutanUtama: 'MOTORCYCLE',
      driverGenderConstraint: 'SEMUA',
      modelRute: 'DYNAMIC_P2P',
      privasiMassal: 'PRIVATE_SINGLE_ORDER',
      waktuLayananDefault: 'EXPRESS_NOW',
      allowedModelOrder: ['PANGGIL_KE_ORDERER', 'JEMPUT_ANTAR_LAIN'],
      penanggungJawabOrder: 'KETEMU_LANGSUNG',
      fiturTalangan: {
        enabled: true,
        maxAmount: 50000,
      },
      alurLayanan: 'DIRECT_PICKUP_DELIVER',
      isBarangPentingDefault: false,
      jangkauanLayanan: {
        maxDistanceKm: 25,
        kotaCoverage: ['Jakarta Selatan', 'Jakarta Pusat'],
      },
      pricing: {
        biayaAdminPerOrder: 2000,
        modelHargaJarak: 'PER_KM',
        biayaPerKm: 3500,
        modelHargaMuatanPcs: 'PER_PCS',
        biayaPerPcs: 1000,
      },
      allowedMuatan: [
        {
          muatanId: 'PERSON',
          namaTampil: 'Penumpang',
          biayaHandlingTambahan: 0,
        },
        {
          muatanId: 'SMALL_PACKAGE',
          namaTampil: 'Paket Kecil',
          biayaHandlingTambahan: 2000,
        },
      ],
      availableFasilitas: [
        {
          fasilitasId: 'HELMET',
          namaTampil: 'Helm Tambahan',
          biayaFasilitasTambahan: 5000,
        },
      ],
    };
  }

  /**
   * Create a modified valid service configuration for update testing
   */
  createModifiedValidServiceConfig(): ServiceConfigBase {
    const config = this.createValidServiceConfig();
    return {
      ...config,
      serviceTypeAlias: 'Ojek Express Updated',
      pricing: {
        ...config.pricing,
        biayaPerKm: 4000, // Increased price
        biayaAdminPerOrder: 2500,
      },
      jangkauanLayanan: {
        maxDistanceKm: 30, // Extended range
        kotaCoverage: ['Jakarta Selatan', 'Jakarta Pusat', 'Jakarta Timur'],
      },
    };
  }

  /**
   * Create an invalid service payload for validation testing
   */
  createInvalidServicePayload(): any {
    return {
      name: 'Te', // Too short (min 3 chars)
      serviceTypeKey: '', // Empty string
      isActive: true,
      configJson: {
        // Missing required fields
        serviceTypeAlias: '',
        modelBisnis: 'INVALID_MODEL', // Invalid enum value
        // Missing other required fields
      },
    };
  }

  /**
   * Create a complex service payload with all optional fields
   */
  createComplexServicePayload(): CreateServicePayload {
    return {
      name: 'Ambulance Emergency Service',
      serviceTypeKey: 'AMBULANCE_EMERGENCY',
      isActive: true,
      configJson: {
        serviceTypeAlias: 'Ambulans Darurat',
        modelBisnis: 'PUBLIC_3RD_PARTY',
        angkutanUtama: 'AMBULANCE',
        driverGenderConstraint: 'SEMUA',
        modelRute: 'DYNAMIC_P2P',
        privasiMassal: 'PRIVATE_SINGLE_ORDER',
        waktuLayananDefault: 'EXPRESS_NOW',
        allowedModelOrder: ['PANGGIL_KE_ORDERER'],
        penanggungJawabOrder: 'KETEMU_LANGSUNG',
        fiturTalangan: {
          enabled: false,
        },
        alurLayanan: 'DIRECT_PICKUP_DELIVER',
        isBarangPentingDefault: true,
        jangkauanLayanan: {
          maxDistanceKm: 50,
          kotaCoverage: ['Jakarta', 'Bogor', 'Depok', 'Tangerang', 'Bekasi'],
        },
        pricing: {
          biayaAdminPerOrder: 5000,
          modelHargaJarak: 'ZONA_ASAL_TUJUAN',
          zonaHarga: [
            {
              asalZona: 'Jakarta Pusat',
              tujuanZona: 'Jakarta Selatan',
              harga: 75000,
            },
            {
              asalZona: 'Jakarta Pusat',
              tujuanZona: 'Bogor',
              harga: 150000,
            },
          ],
        },
        allowedMuatan: [
          {
            muatanId: 'PATIENT',
            namaTampil: 'Pasien',
            biayaHandlingTambahan: 0,
          },
        ],
        availableFasilitas: [
          {
            fasilitasId: 'OXYGEN',
            namaTampil: 'Tabung Oksigen',
            biayaFasilitasTambahan: 25000,
          },
          {
            fasilitasId: 'STRETCHER',
            namaTampil: 'Tandu',
            biayaFasilitasTambahan: 15000,
          },
        ],
        typeSpecificConfig: {
          type: 'AMBULANCE',
          config: {
            isEmergencyService: true,
            medicalEquipmentLevel: 'ADVANCED',
            medicalPersonnelAvailable: ['PARAMEDIC', 'NURSE'],
          },
        },
      },
    };
  }

  /**
   * Create service configuration edge cases for validation testing
   */
  createServiceConfigEdgeCases(): Array<CreateServicePayload & { shouldSucceed: boolean }> {
    return [
      // Valid minimal configuration
      {
        name: 'Minimal Service',
        serviceTypeKey: 'BASIC_TRANSPORT',
        isActive: true,
        configJson: {
          serviceTypeAlias: 'Basic Transport',
          modelBisnis: 'USAHA_SENDIRI',
          angkutanUtama: 'MOTORCYCLE',
          driverGenderConstraint: 'SEMUA',
          modelRute: 'DYNAMIC_P2P',
          privasiMassal: 'PRIVATE_SINGLE_ORDER',
          waktuLayananDefault: 'EXPRESS_NOW',
          allowedModelOrder: ['PANGGIL_KE_ORDERER'],
          penanggungJawabOrder: 'KETEMU_LANGSUNG',
          fiturTalangan: { enabled: false },
          alurLayanan: 'DIRECT_PICKUP_DELIVER',
          isBarangPentingDefault: false,
          jangkauanLayanan: {},
          pricing: {
            biayaAdminPerOrder: 0,
            modelHargaJarak: 'PER_KM',
            biayaPerKm: 1000,
          },
        },
        shouldSucceed: true,
      },
      // Invalid - missing required pricing fields
      {
        name: 'Invalid Pricing',
        serviceTypeKey: 'INVALID_PRICING',
        isActive: true,
        configJson: {
          serviceTypeAlias: 'Invalid Pricing Service',
          modelBisnis: 'USAHA_SENDIRI',
          angkutanUtama: 'MOTORCYCLE',
          driverGenderConstraint: 'SEMUA',
          modelRute: 'DYNAMIC_P2P',
          privasiMassal: 'PRIVATE_SINGLE_ORDER',
          waktuLayananDefault: 'EXPRESS_NOW',
          allowedModelOrder: ['PANGGIL_KE_ORDERER'],
          penanggungJawabOrder: 'KETEMU_LANGSUNG',
          fiturTalangan: { enabled: false },
          alurLayanan: 'DIRECT_PICKUP_DELIVER',
          isBarangPentingDefault: false,
          jangkauanLayanan: {},
          pricing: {
            biayaAdminPerOrder: 0,
            modelHargaJarak: 'PER_KM',
            // Missing biayaPerKm
          },
        } as any,
        shouldSucceed: false,
      },
      // Invalid - negative pricing
      {
        name: 'Negative Pricing',
        serviceTypeKey: 'NEGATIVE_PRICING',
        isActive: true,
        configJson: {
          serviceTypeAlias: 'Negative Pricing Service',
          modelBisnis: 'USAHA_SENDIRI',
          angkutanUtama: 'MOTORCYCLE',
          driverGenderConstraint: 'SEMUA',
          modelRute: 'DYNAMIC_P2P',
          privasiMassal: 'PRIVATE_SINGLE_ORDER',
          waktuLayananDefault: 'EXPRESS_NOW',
          allowedModelOrder: ['PANGGIL_KE_ORDERER'],
          penanggungJawabOrder: 'KETEMU_LANGSUNG',
          fiturTalangan: { enabled: false },
          alurLayanan: 'DIRECT_PICKUP_DELIVER',
          isBarangPentingDefault: false,
          jangkauanLayanan: {},
          pricing: {
            biayaAdminPerOrder: -1000, // Negative value
            modelHargaJarak: 'PER_KM',
            biayaPerKm: 1000,
          },
        } as any,
        shouldSucceed: false,
      },
    ];
  }

  /**
   * Create a valid driver payload for testing
   */
  createValidDriverPayload() {
    return {
      identifier: `driver-${createId()}@test.com`,
      name: 'Test Driver One',
      isActive: true,
      configJson: {
        vehicleType: 'MOTORCYCLE',
        vehicleDetails: {
          brand: 'Honda',
          model: 'Vario 150',
          year: 2022,
          plateNumber: 'B 1234 XYZ',
        },
        capabilities: ['STANDARD_DELIVERY', 'FOOD_DELIVERY'],
        workingHours: {
          start: '06:00',
          end: '22:00',
        },
      },
    };
  }

  /**
   * Create a driver with complex configuration
   */
  createDriverWithComplexConfig() {
    return {
      identifier: `complex-driver-${createId()}@test.com`,
      name: 'Complex Config Driver',
      isActive: true,
      configJson: {
        vehicleType: 'AMBULANCE',
        vehicleDetails: {
          brand: 'Toyota',
          model: 'Hiace Ambulance',
          year: 2023,
          plateNumber: 'B 5678 AMB',
          capacity: 2,
          medicalEquipment: ['OXYGEN_TANK', 'DEFIBRILLATOR', 'STRETCHER'],
        },
        capabilities: ['EMERGENCY_TRANSPORT', 'MEDICAL_ASSISTANCE', 'INTER_HOSPITAL_TRANSFER'],
        certifications: ['PARAMEDIC_LICENSE', 'EMERGENCY_DRIVING_PERMIT'],
        workingHours: {
          start: '00:00',
          end: '23:59',
          isFullTime: true,
        },
        emergencyContact: {
          name: 'Emergency Coordinator',
          phone: '+62812345678',
        },
      },
    };
  }

  /**
   * Generate random test data
   */
  generateRandomServiceName(): string {
    const adjectives = ['Quick', 'Fast', 'Reliable', 'Premium', 'Express', 'Smart'];
    const services = ['Transport', 'Delivery', 'Service', 'Logistics', 'Courier'];

    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const service = services[Math.floor(Math.random() * services.length)];

    return `${adjective} ${service} ${createId().slice(-6)}`;
  }

  /**
   * Generate random driver identifier
   */
  generateRandomDriverIdentifier(): string {
    return `driver-${createId()}@test-${Date.now()}.com`;
  }

  /**
   * Create multiple test services for bulk testing
   */
  createMultipleServices(count: number): CreateServicePayload[] {
    return Array.from({ length: count }, (_, index) => ({
      name: `Test Service ${index + 1} - ${this.generateRandomServiceName()}`,
      serviceTypeKey: `TEST_SERVICE_TYPE_${index + 1}`,
      isActive: Math.random() > 0.2, // 80% active
      configJson: this.createValidServiceConfig(),
    }));
  }

  /**
   * Create multiple test drivers for bulk testing
   */
  createMultipleDrivers(count: number) {
    return Array.from({ length: count }, (_, index) => ({
      identifier: this.generateRandomDriverIdentifier(),
      name: `Test Driver ${index + 1}`,
      isActive: Math.random() > 0.1, // 90% active
      configJson: {
        vehicleType: index % 2 === 0 ? 'MOTORCYCLE' : 'CAR',
        vehicleDetails: {
          brand: index % 2 === 0 ? 'Honda' : 'Toyota',
          model: index % 2 === 0 ? 'Vario' : 'Avanza',
          year: 2020 + (index % 4),
          plateNumber: `B ${1000 + index} TST`,
        },
        capabilities: ['STANDARD_DELIVERY'],
      },
    }));
  }

  /**
   * Create test data for performance testing
   */
  createPerformanceTestData() {
    return {
      services: this.createMultipleServices(50),
      drivers: this.createMultipleDrivers(100),
    };
  }
}
