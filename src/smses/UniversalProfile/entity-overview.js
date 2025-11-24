"use client"
import { useEffect, useState } from "react"
import { Info, ChevronDown, ChevronUp } from "lucide-react"
import { db, auth } from '../../firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Entity types remain the same
const entityTypes = [
  { value: "SME", label: "SME" },
  { value: "Social Enterprise", label: "Social Enterprise" },
  { value: "Funder/Investor", label: "Funder/Investor" },
  { value: "Corporate", label: "Corporate" },
  { value: "Accelerator", label: "Accelerator" },
  { value: "Incubator", label: "Incubator" },
]

const legalStructures = [
  { value: "(pty) Ltd", label: "(Pty) Ltd - Private Company" },
  { value: "Ltd", label: "Ltd - Public Company" },
  { value: "NPC", label: "NPC - Non-Profit Company" },
  { value: "Sole Proprietor", label: "Sole Proprietor" },
  { value: "Partnership", label: "Partnership" },
  { value: "CC", label: "CC - Close Corporation (Legacy)" },
  { value: "Trust", label: "Trust" },
  { value: "Cooperative", label: "Cooperative" },
  { value: "Joint Venture", label: "Joint Venture" },
  { value: "State Owned", label: "State-Owned Enterprise" },
]

// Updated employee-based entity sizes
const entitySizes = [
  { value: "Micro", label: "Micro (0-5 employees)" },
  { value: "Small", label: "Small (6-50 employees)" },
  { value: "Medium", label: "Medium (51-250 employees)" },
  { value: "Large", label: "Large (251+ employees)" },
]

const operationStages = [
  { value: "Startup", label: "Startup" },
  { value: "Growth", label: "Growth" },
  { value: "Scaling", label: "Scaling" },
  { value: "Turnaround", label: "Turnaround" },
  { value: "Mature", label: "Mature" },
]

const economicSectors = [
  { value: "Generalist", label: "Generalist" },
  { value: "Agriculture", label: "Agriculture" },
  { value: "Automotive", label: "Automotive" },
  { value: "Banking, Finance & Insurance", label: "Banking, Finance & Insurance" },
  { value: "Beauty / Cosmetics / Personal Care", label: "Beauty / Cosmetics / Personal Care" },
  { value: "Construction", label: "Construction" },
  { value: "Consulting", label: "Consulting" },
  { value: "Creative Arts / Design", label: "Creative Arts / Design" },
  { value: "Customer Service", label: "Customer Service" },
  { value: "Education & Training", label: "Education & Training" },
  { value: "Engineering", label: "Engineering" },
  { value: "Environmental / Natural Sciences", label: "Environmental / Natural Sciences" },
  { value: "Government / Public Sector", label: "Government / Public Sector" },
  { value: "Healthcare / Medical", label: "Healthcare / Medical" },
  { value: "Hospitality / Tourism", label: "Hospitality / Tourism" },
  { value: "Human Resources", label: "Human Resources" },
  { value: "Information Technology (IT)", label: "Information Technology (IT)" },
  { value: "Infrastructure", label: "Infrastructure" },
  { value: "Legal / Law", label: "Legal / Law" },
  { value: "Logistics / Supply Chain", label: "Logistics / Supply Chain" },
  { value: "Manufacturing", label: "Manufacturing" },
  { value: "Marketing / Advertising / PR", label: "Marketing / Advertising / PR" },
  { value: "Media / Journalism / Broadcasting", label: "Media / Journalism / Broadcasting" },
  { value: "Mining", label: "Mining" },
  { value: "Energy", label: "Energy" },
  { value: "Oil & Gas", label: "Oil & Gas" },
  { value: "Non-Profit / NGO", label: "Non-Profit / NGO" },
  { value: "Property / Real Estate", label: "Property / Real Estate" },
  { value: "Retail / Wholesale", label: "Retail / Wholesale" },
  { value: "Safety & Security / Police / Defence", label: "Safety & Security / Police / Defence" },
  { value: "Sales", label: "Sales" },
  { value: "Science & Research", label: "Science & Research" },
  { value: "Social Services / Social Work", label: "Social Services / Social Work" },
  { value: "Sports / Recreation / Fitness", label: "Sports / Recreation / Fitness" },
  { value: "Telecommunications", label: "Telecommunications" },
  { value: "Transport", label: "Transport" },
  { value: "Utilities (Water, Electricity, Waste)", label: "Utilities (Water, Electricity, Waste)" },
]

// Comprehensive African locations database
const africanLocations = [
  // Algeria
  { town: "Algiers", city: "Algiers", region: "Algiers Province", country: "Algeria" },
  { town: "Oran", city: "Oran", region: "Oran Province", country: "Algeria" },
  { town: "Constantine", city: "Constantine", region: "Constantine Province", country: "Algeria" },
  { town: "Annaba", city: "Annaba", region: "Annaba Province", country: "Algeria" },
  { town: "Batna", city: "Batna", region: "Batna Province", country: "Algeria" },
  { town: "Sétif", city: "Sétif", region: "Sétif Province", country: "Algeria" },
  { town: "Sidi Bel Abbès", city: "Sidi Bel Abbès", region: "Sidi Bel Abbès Province", country: "Algeria" },
  { town: "Biskra", city: "Biskra", region: "Biskra Province", country: "Algeria" },

  // Angola
  { town: "Luanda", city: "Luanda", region: "Luanda Province", country: "Angola" },
  { town: "Huambo", city: "Huambo", region: "Huambo Province", country: "Angola" },
  { town: "Lobito", city: "Lobito", region: "Benguela Province", country: "Angola" },
  { town: "Benguela", city: "Benguela", region: "Benguela Province", country: "Angola" },
  { town: "Lubango", city: "Lubango", region: "Huíla Province", country: "Angola" },
  { town: "Kuito", city: "Kuito", region: "Bié Province", country: "Angola" },
  { town: "Malanje", city: "Malanje", region: "Malanje Province", country: "Angola" },

  // Benin
  { town: "Porto-Novo", city: "Porto-Novo", region: "Ouémé Department", country: "Benin" },
  { town: "Cotonou", city: "Cotonou", region: "Littoral Department", country: "Benin" },
  { town: "Parakou", city: "Parakou", region: "Borgou Department", country: "Benin" },
  { town: "Djougou", city: "Djougou", region: "Donga Department", country: "Benin" },
  { town: "Bohicon", city: "Bohicon", region: "Zou Department", country: "Benin" },

  // Botswana
  { town: "Gaborone", city: "Gaborone", region: "South-East District", country: "Botswana" },
  { town: "Francistown", city: "Francistown", region: "North-East District", country: "Botswana" },
  { town: "Maun", city: "Maun", region: "North-West District", country: "Botswana" },
  { town: "Serowe", city: "Serowe", region: "Central District", country: "Botswana" },
  { town: "Selibe Phikwe", city: "Selibe Phikwe", region: "Central District", country: "Botswana" },

  // Burkina Faso
  { town: "Ouagadougou", city: "Ouagadougou", region: "Centre Region", country: "Burkina Faso" },
  { town: "Bobo-Dioulasso", city: "Bobo-Dioulasso", region: "Hauts-Bassins Region", country: "Burkina Faso" },
  { town: "Koudougou", city: "Koudougou", region: "Centre-Ouest Region", country: "Burkina Faso" },
  { town: "Banfora", city: "Banfora", region: "Cascades Region", country: "Burkina Faso" },

  // Burundi
  { town: "Gitega", city: "Gitega", region: "Gitega Province", country: "Burundi" },
  { town: "Bujumbura", city: "Bujumbura", region: "Bujumbura Mairie Province", country: "Burundi" },
  { town: "Ngozi", city: "Ngozi", region: "Ngozi Province", country: "Burundi" },
  { town: "Muyinga", city: "Muyinga", region: "Muyinga Province", country: "Burundi" },

  // Cameroon
  { town: "Yaoundé", city: "Yaoundé", region: "Centre Region", country: "Cameroon" },
  { town: "Douala", city: "Douala", region: "Littoral Region", country: "Cameroon" },
  { town: "Garoua", city: "Garoua", region: "North Region", country: "Cameroon" },
  { town: "Bamenda", city: "Bamenda", region: "North-West Region", country: "Cameroon" },
  { town: "Bafoussam", city: "Bafoussam", region: "West Region", country: "Cameroon" },

  // Chad
  { town: "N'Djamena", city: "N'Djamena", region: "N'Djamena Region", country: "Chad" },
  { town: "Moundou", city: "Moundou", region: "Logone Occidental Region", country: "Chad" },
  { town: "Sarh", city: "Sarh", region: "Moyen-Chari Region", country: "Chad" },
  { town: "Abéché", city: "Abéché", region: "Ouaddaï Region", country: "Chad" },

  // Congo
  { town: "Brazzaville", city: "Brazzaville", region: "Brazzaville Department", country: "Congo" },
  { town: "Pointe-Noire", city: "Pointe-Noire", region: "Pointe-Noire Department", country: "Congo" },
  { town: "Dolisie", city: "Dolisie", region: "Niari Department", country: "Congo" },

  // Côte d'Ivoire
  { town: "Abidjan", city: "Abidjan", region: "Abidjan Autonomous District", country: "Côte d'Ivoire" },
  { town: "Yamoussoukro", city: "Yamoussoukro", region: "Yamoussoukro Autonomous District", country: "Côte d'Ivoire" },
  { town: "Bouaké", city: "Bouaké", region: "Vallée du Bandama District", country: "Côte d'Ivoire" },
  { town: "Daloa", city: "Daloa", region: "Sassandra-Marahoué District", country: "Côte d'Ivoire" },
  { town: "San-Pédro", city: "San-Pédro", region: "Bas-Sassandra District", country: "Côte d'Ivoire" },

  // DR Congo
  { town: "Kinshasa", city: "Kinshasa", region: "Kinshasa Province", country: "DR Congo" },
  { town: "Lubumbashi", city: "Lubumbashi", region: "Haut-Katanga Province", country: "DR Congo" },
  { town: "Mbuji-Mayi", city: "Mbuji-Mayi", region: "Kasaï-Oriental Province", country: "DR Congo" },
  { town: "Kananga", city: "Kananga", region: "Kasaï-Central Province", country: "DR Congo" },
  { town: "Kisangani", city: "Kisangani", region: "Tshopo Province", country: "DR Congo" },
  { town: "Goma", city: "Goma", region: "North Kivu Province", country: "DR Congo" },
  { town: "Bukavu", city: "Bukavu", region: "South Kivu Province", country: "DR Congo" },

  // Egypt
  { town: "Cairo", city: "Cairo", region: "Cairo Governorate", country: "Egypt" },
  { town: "Alexandria", city: "Alexandria", region: "Alexandria Governorate", country: "Egypt" },
  { town: "Giza", city: "Giza", region: "Giza Governorate", country: "Egypt" },
  { town: "Port Said", city: "Port Said", region: "Port Said Governorate", country: "Egypt" },
  { town: "Suez", city: "Suez", region: "Suez Governorate", country: "Egypt" },
  { town: "Luxor", city: "Luxor", region: "Luxor Governorate", country: "Egypt" },
  { town: "Aswan", city: "Aswan", region: "Aswan Governorate", country: "Egypt" },

  // Ethiopia
  { town: "Addis Ababa", city: "Addis Ababa", region: "Addis Ababa", country: "Ethiopia" },
  { town: "Dire Dawa", city: "Dire Dawa", region: "Dire Dawa", country: "Ethiopia" },
  { town: "Mekelle", city: "Mekelle", region: "Tigray Region", country: "Ethiopia" },
  { town: "Gondar", city: "Gondar", region: "Amhara Region", country: "Ethiopia" },
  { town: "Bahir Dar", city: "Bahir Dar", region: "Amhara Region", country: "Ethiopia" },
  { town: "Hawassa", city: "Hawassa", region: "Sidama Region", country: "Ethiopia" },
  { town: "Jimma", city: "Jimma", region: "Oromia Region", country: "Ethiopia" },

  // Ghana
  { town: "Accra", city: "Accra", region: "Greater Accra Region", country: "Ghana" },
  { town: "Kumasi", city: "Kumasi", region: "Ashanti Region", country: "Ghana" },
  { town: "Tamale", city: "Tamale", region: "Northern Region", country: "Ghana" },
  { town: "Takoradi", city: "Sekondi-Takoradi", region: "Western Region", country: "Ghana" },
  { town: "Cape Coast", city: "Cape Coast", region: "Central Region", country: "Ghana" },
  { town: "Tema", city: "Tema", region: "Greater Accra Region", country: "Ghana" },

  // Kenya
  { town: "Nairobi", city: "Nairobi", region: "Nairobi County", country: "Kenya" },
  { town: "Mombasa", city: "Mombasa", region: "Mombasa County", country: "Kenya" },
  { town: "Kisumu", city: "Kisumu", region: "Kisumu County", country: "Kenya" },
  { town: "Nakuru", city: "Nakuru", region: "Nakuru County", country: "Kenya" },
  { town: "Eldoret", city: "Eldoret", region: "Uasin Gishu County", country: "Kenya" },
  { town: "Thika", city: "Thika", region: "Kiambu County", country: "Kenya" },
  { town: "Malindi", city: "Malindi", region: "Kilifi County", country: "Kenya" },

  // Lesotho
  { town: "Maseru", city: "Maseru", region: "Maseru District", country: "Lesotho" },
  { town: "Mafeteng", city: "Mafeteng", region: "Mafeteng District", country: "Lesotho" },
  { town: "Leribe", city: "Leribe", region: "Leribe District", country: "Lesotho" },
  { town: "Maputsoe", city: "Maputsoe", region: "Leribe District", country: "Lesotho" },

  // Libya
  { town: "Tripoli", city: "Tripoli", region: "Tripoli District", country: "Libya" },
  { town: "Benghazi", city: "Benghazi", region: "Benghazi District", country: "Libya" },
  { town: "Misrata", city: "Misrata", region: "Misrata District", country: "Libya" },
  { town: "Bayda", city: "Bayda", region: "Jabal al Akhdar District", country: "Libya" },

  // Madagascar
  { town: "Antananarivo", city: "Antananarivo", region: "Analamanga Region", country: "Madagascar" },
  { town: "Toamasina", city: "Toamasina", region: "Atsinanana Region", country: "Madagascar" },
  { town: "Antsirabe", city: "Antsirabe", region: "Vakinankaratra Region", country: "Madagascar" },
  { town: "Fianarantsoa", city: "Fianarantsoa", region: "Haute Matsiatra Region", country: "Madagascar" },

  // Malawi
  { town: "Lilongwe", city: "Lilongwe", region: "Central Region", country: "Malawi" },
  { town: "Blantyre", city: "Blantyre", region: "Southern Region", country: "Malawi" },
  { town: "Mzuzu", city: "Mzuzu", region: "Northern Region", country: "Malawi" },
  { town: "Zomba", city: "Zomba", region: "Southern Region", country: "Malawi" },

  // Mali
  { town: "Bamako", city: "Bamako", region: "Bamako Capital District", country: "Mali" },
  { town: "Sikasso", city: "Sikasso", region: "Sikasso Region", country: "Mali" },
  { town: "Mopti", city: "Mopti", region: "Mopti Region", country: "Mali" },
  { town: "Ségou", city: "Ségou", region: "Ségou Region", country: "Mali" },

  // Mauritius
  { town: "Port Louis", city: "Port Louis", region: "Port Louis District", country: "Mauritius" },
  { town: "Vacoas-Phoenix", city: "Vacoas-Phoenix", region: "Plaines Wilhems District", country: "Mauritius" },
  { town: "Curepipe", city: "Curepipe", region: "Plaines Wilhems District", country: "Mauritius" },
  { town: "Quatre Bornes", city: "Quatre Bornes", region: "Plaines Wilhems District", country: "Mauritius" },

  // Morocco
  { town: "Casablanca", city: "Casablanca", region: "Casablanca-Settat", country: "Morocco" },
  { town: "Rabat", city: "Rabat", region: "Rabat-Salé-Kénitra", country: "Morocco" },
  { town: "Fes", city: "Fes", region: "Fès-Meknès", country: "Morocco" },
  { town: "Marrakech", city: "Marrakech", region: "Marrakech-Safi", country: "Morocco" },
  { town: "Agadir", city: "Agadir", region: "Souss-Massa", country: "Morocco" },
  { town: "Tangier", city: "Tangier", region: "Tanger-Tétouan-Al Hoceïma", country: "Morocco" },

  // Mozambique
  { town: "Maputo", city: "Maputo", region: "Maputo City Province", country: "Mozambique" },
  { town: "Matola", city: "Matola", region: "Maputo Province", country: "Mozambique" },
  { town: "Nampula", city: "Nampula", region: "Nampula Province", country: "Mozambique" },
  { town: "Beira", city: "Beira", region: "Sofala Province", country: "Mozambique" },
  { town: "Chimoio", city: "Chimoio", region: "Manica Province", country: "Mozambique" },

  // Namibia
  { town: "Windhoek", city: "Windhoek", region: "Khomas Region", country: "Namibia" },
  { town: "Walvis Bay", city: "Walvis Bay", region: "Erongo Region", country: "Namibia" },
  { town: "Swakopmund", city: "Swakopmund", region: "Erongo Region", country: "Namibia" },
  { town: "Rundu", city: "Rundu", region: "Kavango East Region", country: "Namibia" },

  // Nigeria
  { town: "Lagos", city: "Lagos", region: "Lagos State", country: "Nigeria" },
  { town: "Kano", city: "Kano", region: "Kano State", country: "Nigeria" },
  { town: "Ibadan", city: "Ibadan", region: "Oyo State", country: "Nigeria" },
  { town: "Abuja", city: "Abuja", region: "Federal Capital Territory", country: "Nigeria" },
  { town: "Port Harcourt", city: "Port Harcourt", region: "Rivers State", country: "Nigeria" },
  { town: "Benin City", city: "Benin City", region: "Edo State", country: "Nigeria" },
  { town: "Kaduna", city: "Kaduna", region: "Kaduna State", country: "Nigeria" },
  { town: "Enugu", city: "Enugu", region: "Enugu State", country: "Nigeria" },

  // Rwanda
  { town: "Kigali", city: "Kigali", region: "Kigali Province", country: "Rwanda" },
  { town: "Butare", city: "Butare", region: "Southern Province", country: "Rwanda" },
  { town: "Gitarama", city: "Gitarama", region: "Southern Province", country: "Rwanda" },
  { town: "Ruhengeri", city: "Ruhengeri", region: "Northern Province", country: "Rwanda" },

  // Senegal
  { town: "Dakar", city: "Dakar", region: "Dakar Region", country: "Senegal" },
  { town: "Thiès", city: "Thiès", region: "Thiès Region", country: "Senegal" },
  { town: "Saint-Louis", city: "Saint-Louis", region: "Saint-Louis Region", country: "Senegal" },
  { town: "Kaolack", city: "Kaolack", region: "Kaolack Region", country: "Senegal" },

  // Somalia
  { town: "Mogadishu", city: "Mogadishu", region: "Banaadir Region", country: "Somalia" },
  { town: "Hargeisa", city: "Hargeisa", region: "Woqooyi Galbeed Region", country: "Somalia" },
  { town: "Bosaso", city: "Bosaso", region: "Bari Region", country: "Somalia" },
  { town: "Kismayo", city: "Kismayo", region: "Lower Juba Region", country: "Somalia" },

  // South Africa - Gauteng
  { town: "Johannesburg", city: "Johannesburg", region: "Gauteng", country: "South Africa" },
  { town: "Pretoria", city: "Pretoria", region: "Gauteng", country: "South Africa" },
  { town: "Soweto", city: "Johannesburg", region: "Gauteng", country: "South Africa" },
  { town: "Sandton", city: "Johannesburg", region: "Gauteng", country: "South Africa" },
  { town: "Roodepoort", city: "Johannesburg", region: "Gauteng", country: "South Africa" },
  { town: "Randburg", city: "Johannesburg", region: "Gauteng", country: "South Africa" },
  { town: "Benoni", city: "Ekurhuleni", region: "Gauteng", country: "South Africa" },
  { town: "Boksburg", city: "Ekurhuleni", region: "Gauteng", country: "South Africa" },
  { town: "Centurion", city: "Tshwane", region: "Gauteng", country: "South Africa" },
  { town: "Midrand", city: "Johannesburg", region: "Gauteng", country: "South Africa" },
  
  // South Africa - Western Cape
  { town: "Cape Town", city: "Cape Town", region: "Western Cape", country: "South Africa" },
  { town: "George", city: "George", region: "Western Cape", country: "South Africa" },
  { town: "Stellenbosch", city: "Stellenbosch", region: "Western Cape", country: "South Africa" },
  { town: "Paarl", city: "Paarl", region: "Western Cape", country: "South Africa" },
  { town: "Knysna", city: "Knysna", region: "Western Cape", country: "South Africa" },
  
  // South Africa - KwaZulu-Natal
  { town: "Durban", city: "Durban", region: "KwaZulu-Natal", country: "South Africa" },
  { town: "Pietermaritzburg", city: "Pietermaritzburg", region: "KwaZulu-Natal", country: "South Africa" },
  { town: "Newcastle", city: "Newcastle", region: "KwaZulu-Natal", country: "South Africa" },
  { town: "Richards Bay", city: "Richards Bay", region: "KwaZulu-Natal", country: "South Africa" },
  
  // South Africa - Eastern Cape
  { town: "Port Elizabeth", city: "Gqeberha", region: "Eastern Cape", country: "South Africa" },
  { town: "Gqeberha", city: "Gqeberha", region: "Eastern Cape", country: "South Africa" },
  { town: "East London", city: "East London", region: "Eastern Cape", country: "South Africa" },
  { town: "Mthatha", city: "Mthatha", region: "Eastern Cape", country: "South Africa" },
  
  // South Africa - Free State
  { town: "Bloemfontein", city: "Bloemfontein", region: "Free State", country: "South Africa" },
  { town: "Welkom", city: "Welkom", region: "Free State", country: "South Africa" },
  { town: "Bethlehem", city: "Bethlehem", region: "Free State", country: "South Africa" },
  
  // South Africa - Limpopo
  { town: "Polokwane", city: "Polokwane", region: "Limpopo", country: "South Africa" },
  { town: "Tzaneen", city: "Tzaneen", region: "Limpopo", country: "South Africa" },
  { town: "Mokopane", city: "Mokopane", region: "Limpopo", country: "South Africa" },
  
  // South Africa - Mpumalanga
  { town: "Nelspruit", city: "Mbombela", region: "Mpumalanga", country: "South Africa" },
  { town: "Mbombela", city: "Mbombela", region: "Mpumalanga", country: "South Africa" },
  { town: "Witbank", city: "eMalahleni", region: "Mpumalanga", country: "South Africa" },
  { town: "Middelburg", city: "Middelburg", region: "Mpumalanga", country: "South Africa" },
  
  // South Africa - North West
  { town: "Rustenburg", city: "Rustenburg", region: "North West", country: "South Africa" },
  { town: "Mahikeng", city: "Mahikeng", region: "North West", country: "South Africa" },
  { town: "Klerksdorp", city: "Klerksdorp", region: "North West", country: "South Africa" },
  { town: "Potchefstroom", city: "Potchefstroom", region: "North West", country: "South Africa" },
  
  // South Africa - Northern Cape
  { town: "Kimberley", city: "Kimberley", region: "Northern Cape", country: "South Africa" },
  { town: "Upington", city: "Upington", region: "Northern Cape", country: "South Africa" },
  { town: "Kathu", city: "Kathu", region: "Northern Cape", country: "South Africa" },
  { town: "Kuruman", city: "Kuruman", region: "Northern Cape", country: "South Africa" },

  // Sudan
  { town: "Khartoum", city: "Khartoum", region: "Khartoum State", country: "Sudan" },
  { town: "Omdurman", city: "Omdurman", region: "Khartoum State", country: "Sudan" },
  { town: "Port Sudan", city: "Port Sudan", region: "Red Sea State", country: "Sudan" },
  { town: "Kassala", city: "Kassala", region: "Kassala State", country: "Sudan" },

  // Tanzania
  { town: "Dar es Salaam", city: "Dar es Salaam", region: "Dar es Salaam Region", country: "Tanzania" },
  { town: "Dodoma", city: "Dodoma", region: "Dodoma Region", country: "Tanzania" },
  { town: "Mwanza", city: "Mwanza", region: "Mwanza Region", country: "Tanzania" },
  { town: "Arusha", city: "Arusha", region: "Arusha Region", country: "Tanzania" },
  { town: "Mbeya", city: "Mbeya", region: "Mbeya Region", country: "Tanzania" },
  { town: "Zanzibar City", city: "Zanzibar City", region: "Mjini Magharibi Region", country: "Tanzania" },

  // Togo
  { town: "Lomé", city: "Lomé", region: "Maritime Region", country: "Togo" },
  { town: "Sokodé", city: "Sokodé", region: "Centrale Region", country: "Togo" },
  { town: "Kara", city: "Kara", region: "Kara Region", country: "Togo" },

  // Tunisia
  { town: "Tunis", city: "Tunis", region: "Tunis Governorate", country: "Tunisia" },
  { town: "Sfax", city: "Sfax", region: "Sfax Governorate", country: "Tunisia" },
  { town: "Sousse", city: "Sousse", region: "Sousse Governorate", country: "Tunisia" },
  { town: "Kairouan", city: "Kairouan", region: "Kairouan Governorate", country: "Tunisia" },

  // Uganda
  { town: "Kampala", city: "Kampala", region: "Central Region", country: "Uganda" },
  { town: "Gulu", city: "Gulu", region: "Northern Region", country: "Uganda" },
  { town: "Lira", city: "Lira", region: "Northern Region", country: "Uganda" },
  { town: "Mbarara", city: "Mbarara", region: "Western Region", country: "Uganda" },
  { town: "Jinja", city: "Jinja", region: "Eastern Region", country: "Uganda" },
  { town: "Entebbe", city: "Entebbe", region: "Central Region", country: "Uganda" },

  // Zambia
  { town: "Lusaka", city: "Lusaka", region: "Lusaka Province", country: "Zambia" },
  { town: "Kitwe", city: "Kitwe", region: "Copperbelt Province", country: "Zambia" },
  { town: "Ndola", city: "Ndola", region: "Copperbelt Province", country: "Zambia" },
  { town: "Kabwe", city: "Kabwe", region: "Central Province", country: "Zambia" },
  { town: "Livingstone", city: "Livingstone", region: "Southern Province", country: "Zambia" },

  // Zimbabwe
  { town: "Harare", city: "Harare", region: "Harare Province", country: "Zimbabwe" },
  { town: "Bulawayo", city: "Bulawayo", region: "Bulawayo Province", country: "Zimbabwe" },
  { town: "Mutare", city: "Mutare", region: "Manicaland Province", country: "Zimbabwe" },
  { town: "Gweru", city: "Gweru", region: "Midlands Province", country: "Zimbabwe" },
  { town: "Kwekwe", city: "Kwekwe", region: "Midlands Province", country: "Zimbabwe" },
]

// Simple FormField component
function FormField({ label, required, tooltip, children }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
        {label} {required && <span style={{ color: 'red' }}>*</span>}
        {tooltip && <span style={{ marginLeft: '0.5rem', color: '#666' }}>ℹ️</span>}
      </label>
      {children}
    </div>
  )
}

// MultiSelect component
function MultiSelect({ options, selected, onChange, label }) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleDropdown = () => setIsOpen(!isOpen)
  const closeDropdown = () => setIsOpen(false)

  const handleSelect = (value) => {
    const newSelected = selected.includes(value) 
      ? selected.filter((item) => item !== value) 
      : [...selected, value]
    onChange(newSelected)
  }

  return (
    <div style={{ position: 'relative' }}>
      <div 
        onClick={toggleDropdown}
        style={{
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '8px 12px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '40px'
        }}
      >
        {selected.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {selected.map((sector) => (
              <span 
                key={sector}
                style={{
                  backgroundColor: '#e0e0e0',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '14px'
                }}
              >
                {options.find((opt) => opt.value === sector)?.label || sector}
              </span>
            ))}
          </div>
        ) : (
          <span style={{ color: '#999' }}>Select {label}</span>
        )}
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          border: '1px solid #ccc',
          borderRadius: '4px',
          marginTop: '4px',
          zIndex: 1000,
          maxHeight: '300px',
          overflow: 'auto'
        }}>
          <div style={{ padding: '8px' }}>
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                style={{
                  padding: '8px',
                  cursor: 'pointer',
                  backgroundColor: selected.includes(option.value) ? '#f0f0f0' : 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={() => {}}
                  style={{ cursor: 'pointer' }}
                />
                <span>{option.label}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '8px', borderTop: '1px solid #ccc' }}>
            <button 
              type="button"
              onClick={closeDropdown}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#8B4513',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Searchable Select Component for Country, Region, City
function SearchableSelect({ value, onChange, options, placeholder, searchable = true }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredOptions = searchable 
    ? options.filter(opt => opt.toLowerCase().includes(searchTerm.toLowerCase()))
    : options

  const handleSelect = (option) => {
    onChange(option)
    setIsOpen(false)
    setSearchTerm("")
  }

  return (
    <div style={{ position: 'relative' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '8px 12px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'white'
        }}
      >
        <span style={{ color: value ? '#000' : '#999' }}>
          {value || placeholder}
        </span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          border: '1px solid #ccc',
          borderRadius: '4px',
          marginTop: '4px',
          zIndex: 1000,
          maxHeight: '400px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {searchable && (
            <div style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>
              <input
                type="text"
                placeholder={`Search ${placeholder.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          <div style={{ overflow: 'auto', maxHeight: '340px' }}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option}
                  onClick={() => handleSelect(option)}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    backgroundColor: value === option ? '#f0f0f0' : 'white',
                    borderBottom: '1px solid #f0f0f0'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f8f8'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = value === option ? '#f0f0f0' : 'white'}
                >
                  {option}
                </div>
              ))
            ) : (
              <div style={{ padding: '12px', textAlign: 'center', color: '#999' }}>
                No options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Main component
export default function EntityOverview({ data = {}, updateData }) {
  const [formData, setFormData] = useState({})
  const [isLoading, setIsLoading] = useState(true)

  // Update form data and notify parent
  const updateFormData = (newData) => {
    setFormData(newData)
    updateData(newData)
  }

  // Load data from Firebase
  useEffect(() => {
    const loadEntityOverview = async () => {
      try {
        setIsLoading(true)
        const userId = auth.currentUser?.uid
        
        if (!userId) {
          setIsLoading(false)
          return
        }

        const docRef = doc(db, "universalProfiles", userId)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const profileData = docSnap.data()
          if (profileData.entityOverview) {
            updateFormData(profileData.entityOverview)
          } else {
            // Initialize with empty data or provided data
            updateFormData(data)
          }
        } else {
          // No existing document, initialize with provided data
          updateFormData(data)
        }
      } catch (error) {
        console.error("Error loading entity overview:", error)
        // Fallback to provided data
        updateFormData(data)
      } finally {
        setIsLoading(false)
      }
    }

    loadEntityOverview()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    const newData = { ...formData, [name]: value }
    updateFormData(newData)
  }

  // Get unique countries
  const getCountries = () => {
    const countries = [...new Set(africanLocations.map(loc => loc.country))]
    return countries.sort()
  }

  // Get regions for selected country
  const getRegions = (country) => {
    if (!country) return []
    const regions = [...new Set(
      africanLocations
        .filter(loc => loc.country === country)
        .map(loc => loc.region)
    )]
    return regions.sort()
  }

  // Get cities for selected country and region
  const getCities = (country, region) => {
    if (!country || !region) return []
    const cities = [...new Set(
      africanLocations
        .filter(loc => loc.country === country && loc.region === region)
        .map(loc => loc.city)
    )]
    return cities.sort()
  }

  const handleCountryChange = (country) => {
    const newData = {
      ...formData,
      country: country,
      region: "",
      city: "",
      town: ""
    }
    updateFormData(newData)
  }

  const handleRegionChange = (region) => {
    const newData = {
      ...formData,
      region: region,
      city: "",
      town: ""
    }
    updateFormData(newData)
  }

  const handleCityChange = (city) => {
    const location = africanLocations.find(loc => 
      loc.city === city && 
      loc.region === formData.region && 
      loc.country === formData.country
    )
    if (location) {
      const newData = {
        ...formData,
        city: city,
        town: location.town
      }
      updateFormData(newData)
    }
  }

  const handleMultiSelectChange = (field, value) => {
    const newData = { ...formData, [field]: value }
    updateFormData(newData)
  }

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px'
  }

  if (isLoading) {
    return (
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Entity Overview</h2>
        <p>Loading your information...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Entity Overview</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div>
          <FormField label="Registered Name" required>
            <input
              type="text"
              name="registeredName"
              value={formData.registeredName || ""}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </FormField>

          <FormField label="Trading Name (if different)">
            <input
              type="text"
              name="tradingName"
              value={formData.tradingName || ""}
              onChange={handleChange}
              style={inputStyle}
            />
          </FormField>

          <FormField label="Registration Number" required>
            <input
              type="text"
              name="registrationNumber"
              value={formData.registrationNumber || ""}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </FormField>

          <FormField label="Entity Type" required>
            <select
              name="entityType"
              value={formData.entityType || ""}
              onChange={handleChange}
              style={inputStyle}
              required
            >
              <option value="">Select Entity Type</option>
              {entityTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Legal Structure" required>
            <select
              name="legalStructure"
              value={formData.legalStructure || ""}
              onChange={handleChange}
              style={inputStyle}
              required
            >
              <option value="">Select Legal Structure</option>
              {legalStructures.map((structure) => (
                <option key={structure.value} value={structure.value}>
                  {structure.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Financial Year End" required>
            <input
              type="month"
              name="financialYearEnd"
              value={formData.financialYearEnd || ""}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </FormField>

          <FormField label="No. of Employees" required>
            <input
              type="number"
              name="employeeCount"
              value={formData.employeeCount || ""}
              onChange={handleChange}
              min="0"
              style={inputStyle}
              required
            />
          </FormField>

          <FormField label="Years in Operation" required>
            <input
              type="number"
              name="yearsInOperation"
              value={formData.yearsInOperation || ""}
              onChange={handleChange}
              min="0"
              step="0.5"
              style={inputStyle}
              required
            />
          </FormField>
        </div>

        <div>
          <FormField label="Business Stage" required>
            <select
              name="operationStage"
              value={formData.operationStage || ""}
              onChange={handleChange}
              style={inputStyle}
              required
            >
              <option value="">Select Operation Stage</option>
              {operationStages.map((stage) => (
                <option key={stage.value} value={stage.value}>
                  {stage.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Economic Sector" required>
            <MultiSelect
              options={economicSectors}
              selected={formData.economicSectors || []}
              onChange={(value) => handleMultiSelectChange("economicSectors", value)}
              label="Economic Sectors"
            />
          </FormField>

          {/* Country -> Region -> City order */}
          <FormField label="Country" required>
            <SearchableSelect
              value={formData.country || ""}
              onChange={handleCountryChange}
              options={getCountries()}
              placeholder="Select Country"
            />
          </FormField>

          {formData.country && (
            <FormField label="Province/Region/State" required>
              <SearchableSelect
                value={formData.region || ""}
                onChange={handleRegionChange}
                options={getRegions(formData.country)}
                placeholder="Select Province/Region"
              />
            </FormField>
          )}

          {formData.region && (
            <FormField label="City" required>
              <SearchableSelect
                value={formData.city || ""}
                onChange={handleCityChange}
                options={getCities(formData.country, formData.region)}
                placeholder="Select City"
              />
            </FormField>
          )}

          {/* Auto-populated Town field (hidden but stored) */}
          {formData.town && formData.town !== formData.city && (
            <FormField label="Town/Suburb">
              <input
                type="text"
                value={formData.town}
                style={{...inputStyle, backgroundColor: '#f5f5f5'}}
                disabled
              />
            </FormField>
          )}

          <FormField label="Brief Business Description" required>
            <textarea
              name="businessDescription"
              value={formData.businessDescription || ""}
              onChange={handleChange}
              rows={6}
              style={{...inputStyle, resize: 'vertical'}}
              maxLength={1500}
              required
            />
            <div style={{ 
              fontSize: '12px', 
              color: '#666', 
              marginTop: '4px',
              textAlign: 'right' 
            }}>
              {(formData.businessDescription || "").length}/1500 characters
            </div>
          </FormField>
        </div>
      </div>
    </div>
  )
}