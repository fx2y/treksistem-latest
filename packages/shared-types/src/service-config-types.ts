import { z } from 'zod';

/**
 * Service Pricing Configuration Schema
 * Defines how pricing is calculated for a service
 */
export const ServicePricingConfigSchema = z.object({
  /** Admin fee per order */
  biayaAdminPerOrder: z.number().min(0, "Admin fee must be non-negative"),
  /** Primary pricing model for distance calculation */
  modelHargaJarak: z.enum(['PER_KM', 'ZONA_ASAL_TUJUAN']),
  /** Cost per kilometer (required if modelHargaJarak is PER_KM) */
  biayaPerKm: z.number().min(0).optional(),
  /** Zone-based pricing (required if modelHargaJarak is ZONA_ASAL_TUJUAN) */
  zonaHarga: z.array(z.object({
    asalZona: z.string().min(1, "Origin zone cannot be empty"),
    tujuanZona: z.string().min(1, "Destination zone cannot be empty"),
    harga: z.number().min(0, "Price must be non-negative"),
  })).optional(),
  /** Per-item pricing model */
  modelHargaMuatanPcs: z.enum(['PER_PCS']).optional(),
  /** Cost per piece/item */
  biayaPerPcs: z.number().min(0).optional(),
});

export type ServicePricingConfig = z.infer<typeof ServicePricingConfigSchema>;

/**
 * Allowed Cargo/Load Type Schema
 * Defines what types of cargo/passengers this service can handle
 */
export const AllowedMuatanSchema = z.object({
  /** Unique identifier for the cargo type */
  muatanId: z.string().min(1, "Muatan ID cannot be empty"),
  /** Display name for the cargo type */
  namaTampil: z.string().min(1, "Display name cannot be empty"),
  /** Additional handling fee for this cargo type */
  biayaHandlingTambahan: z.number().min(0).optional(),
});

export type AllowedMuatan = z.infer<typeof AllowedMuatanSchema>;

/**
 * Available Facilities Schema
 * Defines additional facilities/equipment available with this service
 */
export const AvailableFasilitasSchema = z.object({
  /** Unique identifier for the facility */
  fasilitasId: z.string().min(1, "Fasilitas ID cannot be empty"),
  /** Display name for the facility */
  namaTampil: z.string().min(1, "Display name cannot be empty"),
  /** Additional fee for this facility */
  biayaFasilitasTambahan: z.number().min(0).optional(),
});

export type AvailableFasilitas = z.infer<typeof AvailableFasilitasSchema>;

/**
 * Service Coverage Area Schema
 * Defines the geographical coverage of the service
 */
export const JangkauanLayananSchema = z.object({
  /** Maximum distance in kilometers */
  maxDistanceKm: z.number().min(0).optional(),
  /** List of covered cities/areas */
  kotaCoverage: z.array(z.string().min(1)).optional(),
});

export type JangkauanLayanan = z.infer<typeof JangkauanLayananSchema>;

/**
 * Talangan (Credit/Advance) Feature Schema
 * Defines advance payment capabilities
 */
export const FiturTalanganSchema = z.object({
  /** Whether talangan feature is enabled */
  enabled: z.boolean(),
  /** Maximum talangan amount allowed */
  maxAmount: z.number().min(0).optional(),
});

export type FiturTalangan = z.infer<typeof FiturTalanganSchema>;

/**
 * Ambulance-specific Configuration Schema
 * For ambulance services with emergency capabilities
 */
export const AmbulanceConfigSchema = z.object({
  /** Whether this is an emergency ambulance service */
  isEmergencyService: z.boolean(),
  /** Available medical equipment levels */
  medicalEquipmentLevel: z.enum(['BASIC', 'INTERMEDIATE', 'ADVANCED']).optional(),
  /** Certified medical personnel available */
  medicalPersonnelAvailable: z.array(z.enum(['PARAMEDIC', 'NURSE', 'DOCTOR'])).optional(),
});

export type AmbulanceConfig = z.infer<typeof AmbulanceConfigSchema>;

/**
 * Schedule Entry Schema for Fixed Route Services
 * Defines a single schedule entry
 */
export const JadwalRuteSchema = z.object({
  /** Day of the week */
  hari: z.enum(['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU', 'MINGGU']),
  /** Start time in HH:MM format */
  jamMulai: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  /** Pickup points with estimated times */
  titikJemput: z.array(z.object({
    namaLokasi: z.string().min(1, "Location name cannot be empty"),
    perkiraanWaktu: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  })),
  /** Drop-off points with estimated times */
  titikAntar: z.array(z.object({
    namaLokasi: z.string().min(1, "Location name cannot be empty"),
    perkiraanWaktu: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  })),
});

export type JadwalRute = z.infer<typeof JadwalRuteSchema>;

/**
 * Fixed Route Service Configuration Schema
 * For scheduled services like school shuttles
 */
export const FixedRouteConfigSchema = z.object({
  /** Route schedules */
  jadwalRute: z.array(JadwalRuteSchema).min(1, "At least one schedule is required"),
  /** Maximum passengers per trip */
  maxPassengersPerTrip: z.number().min(1).optional(),
  /** Whether advance booking is required */
  requiresAdvanceBooking: z.boolean().default(false),
  /** How many days in advance booking is allowed */
  maxAdvanceBookingDays: z.number().min(1).optional(),
});

export type FixedRouteConfig = z.infer<typeof FixedRouteConfigSchema>;

/**
 * Main Service Configuration Schema
 * Based on RFC-TREK-CONFIG-001 ServiceConfigBase interface
 */
export const ServiceConfigBaseSchema = z.object({
  /** User-facing service name/alias */
  serviceTypeAlias: z.string().min(1, "Service type alias cannot be empty"),
  /** Business model type */
  modelBisnis: z.enum(['USAHA_SENDIRI', 'PUBLIC_3RD_PARTY']),
  /** Primary vehicle/transport type */
  angkutanUtama: z.string().min(1, "Primary transport type cannot be empty"),
  /** Driver gender constraint */
  driverGenderConstraint: z.enum(['PRIA', 'WANITA', 'SEMUA']).default('SEMUA'),
  /** Route model */
  modelRute: z.enum(['DYNAMIC_P2P', 'FIXED_SCHEDULED']),
  /** Privacy/mass service model */
  privasiMassal: z.enum(['PRIVATE_SINGLE_ORDER', 'MASSAL_MULTI_ORDER']),
  /** Default service timing */
  waktuLayananDefault: z.enum(['EXPRESS_NOW', 'SCHEDULED_TIME']),
  /** Allowed order models */
  allowedModelOrder: z.array(z.enum(['PANGGIL_KE_ORDERER', 'JEMPUT_ANTAR_LAIN', 'AMBIL_ANTAR_ORDERER'])).min(1, "At least one order model is required"),
  /** Order responsibility model */
  penanggungJawabOrder: z.enum(['KETEMU_LANGSUNG', 'DIWAKILKAN', 'BEBAS_NON_KONTAK']),
  /** Talangan (advance payment) feature configuration */
  fiturTalangan: FiturTalanganSchema,
  /** Service flow/process */
  alurLayanan: z.enum(['DIRECT_PICKUP_DELIVER']),
  /** Whether orders are considered high-value by default */
  isBarangPentingDefault: z.boolean().default(false),
  /** Service coverage area */
  jangkauanLayanan: JangkauanLayananSchema,
  /** Pricing configuration */
  pricing: ServicePricingConfigSchema,
  /** Allowed cargo/load types */
  allowedMuatan: z.array(AllowedMuatanSchema).optional(),
  /** Available facilities */
  availableFasilitas: z.array(AvailableFasilitasSchema).optional(),
  /** Type-specific configuration for specialized services */
  typeSpecificConfig: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('AMBULANCE'),
      config: AmbulanceConfigSchema,
    }),
    z.object({
      type: z.literal('FIXED_ROUTE'),
      config: FixedRouteConfigSchema,
    }),
  ]).optional(),
});

export type ServiceConfigBase = z.infer<typeof ServiceConfigBaseSchema>;

/**
 * Driver Configuration Schema
 * Stored in drivers.configJson field
 */
export const DriverConfigSchema = z.object({
  /** Vehicle information */
  vehicle: z.object({
    type: z.string().min(1, "Vehicle type is required"),
    brand: z.string().optional(),
    model: z.string().optional(),
    year: z.number().optional(),
    plateNumber: z.string().optional(),
    color: z.string().optional(),
  }),
  /** Driver capabilities */
  capabilities: z.array(z.string()).optional(),
  /** Available equipment */
  equipment: z.array(z.string()).optional(),
  /** Special certifications */
  certifications: z.array(z.string()).optional(),
  /** Operating hours */
  operatingHours: z.object({
    /** Days of the week the driver is available */
    availableDays: z.array(z.enum(['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU', 'MINGGU'])),
    /** Start time */
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format").optional(),
    /** End time */
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format").optional(),
    /** Whether available 24/7 */
    is24Hours: z.boolean().default(false),
  }).optional(),
});

export type DriverConfig = z.infer<typeof DriverConfigSchema>; 