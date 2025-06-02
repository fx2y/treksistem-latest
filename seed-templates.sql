INSERT INTO master_service_templates (
  id, 
  name, 
  description, 
  applies_to_service_type_key, 
  config_json, 
  sort_order,
  created_at,
  updated_at
) VALUES (
  'MOTOR_P2P_STD_TPL',
  'Standard Motorcycle Taxi (Ojek)',
  'A template for standard point-to-point motorcycle taxi services with passenger transport.',
  'MOTOR_P2P_EXPRESS',
  '{"serviceTypeAlias":"Ojek Standard","modelBisnis":"PUBLIC_3RD_PARTY","angkutanUtama":"MOTOR","driverGenderConstraint":"SEMUA","modelRute":"DYNAMIC_P2P","privasiMassal":"PRIVATE_SINGLE_ORDER","waktuLayananDefault":"EXPRESS_NOW","allowedModelOrder":["PANGGIL_KE_ORDERER"],"penanggungJawabOrder":"KETEMU_LANGSUNG","fiturTalangan":{"enabled":false},"alurLayanan":"DIRECT_PICKUP_DELIVER","isBarangPentingDefault":false,"jangkauanLayanan":{"maxDistanceKm":15,"kotaCoverage":["Malang Kota","Kab Malang"]},"pricing":{"biayaAdminPerOrder":2000,"modelHargaJarak":"PER_KM","biayaPerKm":3000},"allowedMuatan":[{"muatanId":"PENUMPANG","namaTampil":"Penumpang","biayaHandlingTambahan":0}],"availableFasilitas":[{"fasilitasId":"HELM","namaTampil":"Helm","biayaFasilitasTambahan":0}]}',
  1,
  (unixepoch('subsec') * 1000),
  (unixepoch('subsec') * 1000)
) ON CONFLICT(id) DO UPDATE SET
  name = excluded.name,
  description = excluded.description,
  applies_to_service_type_key = excluded.applies_to_service_type_key,
  config_json = excluded.config_json,
  sort_order = excluded.sort_order,
  updated_at = (unixepoch('subsec') * 1000);

INSERT INTO master_service_templates (
  id, 
  name, 
  description, 
  applies_to_service_type_key, 
  config_json, 
  sort_order,
  created_at,
  updated_at
) VALUES (
  'MOTOR_FOOD_DELIVERY_TPL',
  'Food Delivery Courier',
  'A template for motorcycle-based food delivery services with insulated bags.',
  'MOTOR_FOOD_COURIER',
  '{"serviceTypeAlias":"Kurir Makanan","modelBisnis":"PUBLIC_3RD_PARTY","angkutanUtama":"MOTOR","driverGenderConstraint":"SEMUA","modelRute":"DYNAMIC_P2P","privasiMassal":"PRIVATE_SINGLE_ORDER","waktuLayananDefault":"EXPRESS_NOW","allowedModelOrder":["AMBIL_ANTAR_ORDERER"],"penanggungJawabOrder":"DIWAKILKAN","fiturTalangan":{"enabled":true,"maxAmount":100000},"alurLayanan":"DIRECT_PICKUP_DELIVER","isBarangPentingDefault":false,"jangkauanLayanan":{"maxDistanceKm":10,"kotaCoverage":["Malang Kota"]},"pricing":{"biayaAdminPerOrder":1500,"modelHargaJarak":"PER_KM","biayaPerKm":2500},"allowedMuatan":[{"muatanId":"PAKET_MAKANAN","namaTampil":"Paket Makanan","biayaHandlingTambahan":0},{"muatanId":"MINUMAN","namaTampil":"Minuman","biayaHandlingTambahan":0}],"availableFasilitas":[{"fasilitasId":"TAS_PENGHANGAT","namaTampil":"Tas Penghangat Makanan","biayaFasilitasTambahan":0}]}',
  2,
  (unixepoch('subsec') * 1000),
  (unixepoch('subsec') * 1000)
) ON CONFLICT(id) DO UPDATE SET
  name = excluded.name,
  description = excluded.description,
  applies_to_service_type_key = excluded.applies_to_service_type_key,
  config_json = excluded.config_json,
  sort_order = excluded.sort_order,
  updated_at = (unixepoch('subsec') * 1000);

INSERT INTO master_service_templates (
  id, 
  name, 
  description, 
  applies_to_service_type_key, 
  config_json, 
  sort_order,
  created_at,
  updated_at
) VALUES (
  'MOTOR_PACKAGE_COURIER_TPL',
  'Package Courier Service',
  'A template for general package delivery services using motorcycles.',
  'MOTOR_PACKAGE_COURIER',
  '{"serviceTypeAlias":"Kurir Paket","modelBisnis":"PUBLIC_3RD_PARTY","angkutanUtama":"MOTOR","driverGenderConstraint":"SEMUA","modelRute":"DYNAMIC_P2P","privasiMassal":"PRIVATE_SINGLE_ORDER","waktuLayananDefault":"EXPRESS_NOW","allowedModelOrder":["AMBIL_ANTAR_ORDERER","JEMPUT_ANTAR_LAIN"],"penanggungJawabOrder":"DIWAKILKAN","fiturTalangan":{"enabled":true,"maxAmount":200000},"alurLayanan":"DIRECT_PICKUP_DELIVER","isBarangPentingDefault":true,"jangkauanLayanan":{"maxDistanceKm":20,"kotaCoverage":["Malang Kota","Kab Malang","Batu"]},"pricing":{"biayaAdminPerOrder":2500,"modelHargaJarak":"PER_KM","biayaPerKm":3500},"allowedMuatan":[{"muatanId":"PAKET_KECIL","namaTampil":"Paket Kecil (< 5kg)","biayaHandlingTambahan":0},{"muatanId":"DOKUMEN","namaTampil":"Dokumen Penting","biayaHandlingTambahan":1000}],"availableFasilitas":[{"fasilitasId":"BOX_PENGAMAN","namaTampil":"Box Pengaman","biayaFasilitasTambahan":2000}]}',
  3,
  (unixepoch('subsec') * 1000),
  (unixepoch('subsec') * 1000)
) ON CONFLICT(id) DO UPDATE SET
  name = excluded.name,
  description = excluded.description,
  applies_to_service_type_key = excluded.applies_to_service_type_key,
  config_json = excluded.config_json,
  sort_order = excluded.sort_order,
  updated_at = (unixepoch('subsec') * 1000);

INSERT INTO master_service_templates (
  id, 
  name, 
  description, 
  applies_to_service_type_key, 
  config_json, 
  sort_order,
  created_at,
  updated_at
) VALUES (
  'MOBIL_ANJEM_BASIC_TPL',
  'Basic Car Shuttle Service',
  'A template for basic car-based shuttle services for multiple passengers.',
  'MOBIL_ANJEM_BASIC',
  '{"serviceTypeAlias":"Antar Jemput Mobil","modelBisnis":"PUBLIC_3RD_PARTY","angkutanUtama":"MOBIL","driverGenderConstraint":"SEMUA","modelRute":"DYNAMIC_P2P","privasiMassal":"MASSAL_MULTI_ORDER","waktuLayananDefault":"SCHEDULED_TIME","allowedModelOrder":["JEMPUT_ANTAR_LAIN"],"penanggungJawabOrder":"KETEMU_LANGSUNG","fiturTalangan":{"enabled":false},"alurLayanan":"DIRECT_PICKUP_DELIVER","isBarangPentingDefault":false,"jangkauanLayanan":{"maxDistanceKm":25,"kotaCoverage":["Malang Kota","Kab Malang","Batu"]},"pricing":{"biayaAdminPerOrder":3000,"modelHargaJarak":"PER_KM","biayaPerKm":4000,"modelHargaMuatanPcs":"PER_PCS","biayaPerPcs":15000},"allowedMuatan":[{"muatanId":"PENUMPANG","namaTampil":"Penumpang","biayaHandlingTambahan":0}],"availableFasilitas":[{"fasilitasId":"AC","namaTampil":"Air Conditioning","biayaFasilitasTambahan":0},{"fasilitasId":"WIFI","namaTampil":"WiFi","biayaFasilitasTambahan":5000}]}',
  4,
  (unixepoch('subsec') * 1000),
  (unixepoch('subsec') * 1000)
) ON CONFLICT(id) DO UPDATE SET
  name = excluded.name,
  description = excluded.description,
  applies_to_service_type_key = excluded.applies_to_service_type_key,
  config_json = excluded.config_json,
  sort_order = excluded.sort_order,
  updated_at = (unixepoch('subsec') * 1000);

INSERT INTO master_service_templates (
  id, 
  name, 
  description, 
  applies_to_service_type_key, 
  config_json, 
  sort_order,
  created_at,
  updated_at
) VALUES (
  'AMBULANCE_TRANSPORT_TPL',
  'Non-Emergency Ambulance Transport',
  'A template for non-emergency medical transport services with basic medical equipment.',
  'AMBULANCE_TRANSPORT',
  '{"serviceTypeAlias":"Ambulance Transport","modelBisnis":"USAHA_SENDIRI","angkutanUtama":"AMBULANCE","driverGenderConstraint":"SEMUA","modelRute":"DYNAMIC_P2P","privasiMassal":"PRIVATE_SINGLE_ORDER","waktuLayananDefault":"SCHEDULED_TIME","allowedModelOrder":["JEMPUT_ANTAR_LAIN"],"penanggungJawabOrder":"KETEMU_LANGSUNG","fiturTalangan":{"enabled":false},"alurLayanan":"DIRECT_PICKUP_DELIVER","isBarangPentingDefault":true,"jangkauanLayanan":{"maxDistanceKm":50,"kotaCoverage":["Malang Kota","Kab Malang","Batu","Pasuruan"]},"pricing":{"biayaAdminPerOrder":5000,"modelHargaJarak":"PER_KM","biayaPerKm":8000},"allowedMuatan":[{"muatanId":"PASIEN_SAKIT","namaTampil":"Pasien Sakit","biayaHandlingTambahan":0}],"availableFasilitas":[{"fasilitasId":"KURSI_RODA_TRANSPORT","namaTampil":"Kursi Roda (Transport)","biayaFasilitasTambahan":10000},{"fasilitasId":"P3K_DASAR","namaTampil":"P3K Dasar","biayaFasilitasTambahan":0},{"fasilitasId":"OKSIGEN_PORTABLE","namaTampil":"Oksigen Portable","biayaFasilitasTambahan":25000}],"typeSpecificConfig":{"type":"AMBULANCE","config":{"isEmergencyService":false,"medicalEquipmentLevel":"BASIC","medicalPersonnelAvailable":["PARAMEDIC"]}}}',
  5,
  (unixepoch('subsec') * 1000),
  (unixepoch('subsec') * 1000)
) ON CONFLICT(id) DO UPDATE SET
  name = excluded.name,
  description = excluded.description,
  applies_to_service_type_key = excluded.applies_to_service_type_key,
  config_json = excluded.config_json,
  sort_order = excluded.sort_order,
  updated_at = (unixepoch('subsec') * 1000);
