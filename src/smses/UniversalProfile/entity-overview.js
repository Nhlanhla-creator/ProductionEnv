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

const entitySizes = [
  { value: "Micro", label: "Micro (< R1M annual turnover)" },
  { value: "Small", label: "Small (R1M - R10M annual turnover)" },
  { value: "Medium", label: "Medium (R10M - R50M annual turnover)" },
  { value: "Large", label: "Large (> R50M annual turnover)" },
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

const africanCountries = [
  { value: "Algeria", label: "Algeria" },
  { value: "Angola", label: "Angola" },
  { value: "Benin", label: "Benin" },
  { value: "Botswana", label: "Botswana" },
  { value: "Burkina Faso", label: "Burkina Faso" },
  { value: "Burundi", label: "Burundi" },
  { value: "Cabo Verde", label: "Cabo Verde" },
  { value: "Cameroon", label: "Cameroon" },
  { value: "Central African Republic", label: "Central African Republic" },
  { value: "Chad", label: "Chad" },
  { value: "Comoros", label: "Comoros" },
  { value: "Congo", label: "Congo" },
  { value: "Côte d'Ivoire", label: "Côte d'Ivoire" },
  { value: "Djibouti", label: "Djibouti" },
  { value: "DR Congo", label: "DR Congo" },
  { value: "Egypt", label: "Egypt" },
  { value: "Equatorial Guinea", label: "Equatorial Guinea" },
  { value: "Eritrea", label: "Eritrea" },
  { value: "Eswatini", label: "Eswatini" },
  { value: "Ethiopia", label: "Ethiopia" },
  { value: "Gabon", label: "Gabon" },
  { value: "Gambia", label: "Gambia" },
  { value: "Ghana", label: "Ghana" },
  { value: "Guinea", label: "Guinea" },
  { value: "Guinea-Bissau", label: "Guinea-Bissau" },
  { value: "Kenya", label: "Kenya" },
  { value: "Lesotho", label: "Lesotho" },
  { value: "Liberia", label: "Liberia" },
  { value: "Libya", label: "Libya" },
  { value: "Madagascar", label: "Madagascar" },
  { value: "Malawi", label: "Malawi" },
  { value: "Mali", label: "Mali" },
  { value: "Mauritania", label: "Mauritania" },
  { value: "Mauritius", label: "Mauritius" },
  { value: "Morocco", label: "Morocco" },
  { value: "Mozambique", label: "Mozambique" },
  { value: "Namibia", label: "Namibia" },
  { value: "Niger", label: "Niger" },
  { value: "Nigeria", label: "Nigeria" },
  { value: "Rwanda", label: "Rwanda" },
  { value: "São Tomé and Príncipe", label: "São Tomé and Príncipe" },
  { value: "Senegal", label: "Senegal" },
  { value: "Seychelles", label: "Seychelles" },
  { value: "Sierra Leone", label: "Sierra Leone" },
  { value: "Somalia", label: "Somalia" },
  { value: "South Africa", label: "South Africa" },
  { value: "South Sudan", label: "South Sudan" },
  { value: "Sudan", label: "Sudan" },
  { value: "Tanzania", label: "Tanzania" },
  { value: "Togo", label: "Togo" },
  { value: "Tunisia", label: "Tunisia" },
  { value: "Uganda", label: "Uganda" },
  { value: "Zambia", label: "Zambia" },
  { value: "Zimbabwe", label: "Zimbabwe" },
]

// City mapping for each country
const citiesByCountry = {
  "Algeria": [
    "Algiers", "Oran", "Constantine", "Annaba", "Batna",
    "Sétif", "Sidi Bel Abbès", "Biskra", "Tébessa", "El Oued"
  ],
  "Angola": [
    "Luanda", "Huambo", "Lobito", "Benguela", "Lubango",
    "Kuito", "Malanje", "Namibe", "Soyo", "Cabinda"
  ],
  "Benin": [
    "Porto-Novo", "Cotonou", "Parakou", "Djougou", "Bohicon",
    "Kandi", "Lokossa", "Ouidah", "Abomey", "Natitingou"
  ],
  "Botswana": [
    "Gaborone", "Francistown", "Molepolole", "Maun", "Serowe",
    "Selibe Phikwe", "Kanye", "Mochudi", "Mahalapye", "Palapye"
  ],
  "Burkina Faso": [
    "Ouagadougou", "Bobo-Dioulasso", "Koudougou", "Banfora", "Ouahigouya",
    "Dedougou", "Fada N'gourma", "Kaya", "Tenkodogo", "Houndé"
  ],
  "Burundi": [
    "Gitega", "Bujumbura", "Muyinga", "Ngozi", "Ruyigi",
    "Kayanza", "Makamba", "Bururi", "Cibitoke", "Rutana"
  ],
  "Cabo Verde": [
    "Praia", "Mindelo", "Santa Maria", "Assomada", "Pedra Badejo",
    "São Filipe", "Tarrafal", "Vila do Maio", "Porto Novo", "Ponta do Sol"
  ],
  "Cameroon": [
    "Yaoundé", "Douala", "Garoua", "Bamenda", "Bafoussam",
    "Maroua", "Ngaoundéré", "Bertoua", "Kumba", "Nkongsamba"
  ],
  "Central African Republic": [
    "Bangui", "Bimbo", "Mbaïki", "Berbérati", "Carnot",
    "Bambari", "Bouar", "Bossangoa", "Bria", "Bangassou"
  ],
  "Chad": [
    "N'Djamena", "Moundou", "Sarh", "Abéché", "Kélo",
    "Koumra", "Pala", "Am Timan", "Bongor", "Mongo"
  ],
  "Comoros": [
    "Moroni", "Mutsamudu", "Fomboni", "Domoni", "Ouani",
    "Sima", "Mitsamiouli", "Adda-Douéni", "Koni-Djodjo", "Tsimbeo"
  ],
  "Congo": [
    "Brazzaville", "Pointe-Noire", "Dolisie", "Nkayi", "Owando",
    "Ouesso", "Impfondo", "Sibiti", "Loandjili", "Madingou"
  ],
  "Côte d'Ivoire": [
    "Abidjan", "Yamoussoukro", "Bouaké", "Daloa", "San-Pédro",
    "Korhogo", "Man", "Divo", "Gagnoa", "Anyama"
  ],
  "Djibouti": [
    "Djibouti", "Ali Sabieh", "Tadjourah", "Obock", "Dikhil",
    "Arta", "Holhol", "Loyada", "Randa", "Balho"
  ],
  "DR Congo": [
    "Kinshasa", "Lubumbashi", "Mbuji-Mayi", "Kananga", "Kisangani",
    "Goma", "Bukavu", "Kolwezi", "Likasi", "Tshikapa"
  ],
  "Egypt": [
    "Cairo", "Alexandria", "Giza", "Shubra El-Kheima", "Port Said",
    "Suez", "Luxor", "Mansoura", "Tanta", "Asyut"
  ],
  "Equatorial Guinea": [
    "Malabo", "Bata", "Ebebiyin", "Aconibe", "Añisoc",
    "Luba", "Evinayong", "Mongomo", "Mengomeyén", "Rebola"
  ],
  "Eritrea": [
    "Asmara", "Keren", "Massawa", "Assab", "Mendefera",
    "Barentu", "Adi Keyh", "Adi Quala", "Dekemhare", "Ak'ordat"
  ],
  "Eswatini": [
    "Mbabane", "Manzini", "Lobamba", "Siteki", "Malkerns",
    "Nhlangano", "Piggs Peak", "Big Bend", "Hluti", "Simunye"
  ],
  "Ethiopia": [
    "Addis Ababa", "Dire Dawa", "Mekelle", "Gondar", "Bahir Dar",
    "Hawassa", "Dessie", "Jimma", "Jijiga", "Shashamane"
  ],
  "Gabon": [
    "Libreville", "Port-Gentil", "Franceville", "Oyem", "Moanda",
    "Mouila", "Lambaréné", "Tchibanga", "Koulamoutou", "Makokou"
  ],
  "Gambia": [
    "Banjul", "Serekunda", "Brikama", "Bakau", "Farafenni",
    "Lamin", "Sukuta", "Basse Santa Su", "Gunjur", "Soma"
  ],
  "Ghana": [
    "Accra", "Kumasi", "Tamale", "Takoradi", "Ashaiman",
    "Tema", "Teshie", "Cape Coast", "Obuasi", "Koforidua"
  ],
  "Guinea": [
    "Conakry", "Nzérékoré", "Kankan", "Kindia", "Labé",
    "Siguiri", "Kamsar", "Kissidougou", "Guéckédou", "Boké"
  ],
  "Guinea-Bissau": [
    "Bissau", "Gabú", "Bafatá", "Canchungo", "Bissorã",
    "Bolama", "Cacheu", "Catió", "Bubaque", "Farim"
  ],
  "Kenya": [
    "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret",
    "Thika", "Malindi", "Kitale", "Garissa", "Kakamega"
  ],
  "Lesotho": [
    "Maseru", "Mafeteng", "Leribe", "Maputsoe", "Mohale's Hoek",
    "Qacha's Nek", "Quthing", "Butha-Buthe", "Mokhotlong", "Thaba-Tseka"
  ],
  "Liberia": [
    "Monrovia", "Gbarnga", "Kakata", "Bensonville", "Harper",
    "Voinjama", "Buchanan", "Zwedru", "New Yekepa", "Ganta"
  ],
  "Libya": [
    "Tripoli", "Benghazi", "Misrata", "Bayda", "Zawiya",
    "Ajdabiya", "Tobruk", "Sabha", "Sirte", "Derna"
  ],
  "Madagascar": [
    "Antananarivo", "Toamasina", "Antsirabe", "Fianarantsoa", "Mahajanga",
    "Toliara", "Antsiranana", "Ambovombe", "Antanifotsy", "Ambanja"
  ],
  "Malawi": [
    "Lilongwe", "Blantyre", "Mzuzu", "Zomba", "Kasungu",
    "Mangochi", "Karonga", "Salima", "Liwonde", "Dedza"
  ],
  "Mali": [
    "Bamako", "Sikasso", "Mopti", "Koutiala", "Kayes",
    "Ségou", "Gao", "Kati", "San", "Tombouctou"
  ],
  "Mauritania": [
    "Nouakchott", "Nouadhibou", "Néma", "Kaédi", "Rosso",
    "Zouérat", "Kiffa", "Atar", "Sélibaby", "Aleg"
  ],
  "Mauritius": [
    "Port Louis", "Beau Bassin-Rose Hill", "Vacoas-Phoenix", "Curepipe", "Quatre Bornes",
    "Triolet", "Goodlands", "Centre de Flacq", "Mahebourg", "Saint Pierre"
  ],
  "Morocco": [
    "Casablanca", "Rabat", "Fes", "Marrakech", "Agadir",
    "Tangier", "Meknes", "Oujda", "Kenitra", "Tetouan"
  ],
  "Mozambique": [
    "Maputo", "Matola", "Nampula", "Beira", "Chimoio",
    "Nacala", "Quelimane", "Tete", "Lichinga", "Pemba"
  ],
  "Namibia": [
    "Windhoek", "Rundu", "Walvis Bay", "Oshakati", "Swakopmund",
    "Katima Mulilo", "Grootfontein", "Rehoboth", "Otjiwarongo", "Ondangwa"
  ],
  "Niger": [
    "Niamey", "Zinder", "Maradi", "Agadez", "Tahoua",
    "Dosso", "Diffa", "Arlit", "Tillabéri", "Ayorou"
  ],
  "Nigeria": [
    "Lagos", "Kano", "Ibadan", "Abuja", "Port Harcourt",
    "Benin City", "Kaduna", "Maiduguri", "Zaria", "Aba"
  ],
  "Rwanda": [
    "Kigali", "Butare", "Gitarama", "Ruhengeri", "Gisenyi",
    "Byumba", "Cyangugu", "Kibungo", "Kibuye", "Rwamagana"
  ],
  "São Tomé and Príncipe": [
    "São Tomé", "Santo António", "Trindade", "Neves", "Santana",
    "Guadalupe", "Santo Amaro", "São João dos Angolares", "Porto Alegre", "Ribeira Afonso"
  ],
  "Senegal": [
    "Dakar", "Touba", "Thiès", "Kaolack", "Saint-Louis",
    "Ziguinchor", "Mbour", "Diourbel", "Tambacounda", "Rufisque"
  ],
  "Seychelles": [
    "Victoria", "Anse Boileau", "Beau Vallon", "Cascade", "Takamaka",
    "Anse Royale", "Bel Ombre", "Grand Anse", "La Digue", "Baie Lazare"
  ],
  "Sierra Leone": [
    "Freetown", "Bo", "Kenema", "Makeni", "Koidu",
    "Lunsar", "Port Loko", "Waterloo", "Kabala", "Magburaka"
  ],
  "Somalia": [
    "Mogadishu", "Hargeisa", "Bosaso", "Kismayo", "Merca",
    "Jamame", "Beledweyne", "Baidoa", "Burao", "Galkayo"
  ],
  "South Africa": [
    "Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth",
    "Bloemfontein", "East London", "Nelspruit", "Polokwane", "Kimberley",
    "Pietermaritzburg", "Rustenburg", "George", "Middelburg", "Witbank"
  ],
  "South Sudan": [
    "Juba", "Malakal", "Wau", "Yei", "Bor",
    "Yambio", "Aweil", "Rumbek", "Torit", "Bentiu"
  ],
  "Sudan": [
    "Khartoum", "Omdurman", "Port Sudan", "Kassala", "El-Obeid",
    "Nyala", "Wad Madani", "El Fasher", "Kosti", "El Gadarif"
  ],
  "Tanzania": [
    "Dar es Salaam", "Dodoma", "Mwanza", "Arusha", "Mbeya",
    "Morogoro", "Tanga", "Zanzibar City", "Kigoma", "Tabora"
  ],
  "Togo": [
    "Lomé", "Sokodé", "Kara", "Atakpamé", "Kpalimé",
    "Bassar", "Tsévié", "Aného", "Sansanné-Mango", "Dapaong"
  ],
  "Tunisia": [
    "Tunis", "Sfax", "Sousse", "Kairouan", "Bizerte",
    "Gabès", "Ariana", "Gafsa", "Monastir", "Ben Arous"
  ],
  "Uganda": [
    "Kampala", "Gulu", "Lira", "Mbarara", "Jinja",
    "Mbale", "Mukono", "Kasese", "Masaka", "Entebbe"
  ],
  "Zambia": [
    "Lusaka", "Kitwe", "Ndola", "Kabwe", "Chingola",
    "Mufulira", "Livingstone", "Luanshya", "Kasama", "Chipata"
  ],
  "Zimbabwe": [
    "Harare", "Bulawayo", "Chitungwiza", "Mutare", "Gweru",
    "Kwekwe", "Kadoma", "Masvingo", "Chinhoyi", "Marondera"
  ]
}

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
                backgroundColor: '#007bff',
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
    
    // If country changes, clear city selection
    if (name === "location") {
      newData.city = ""
    }
    
    updateFormData(newData)
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

          <FormField label="Entity Size" required>
            <select
              name="entitySize"
              value={formData.entitySize || ""}
              onChange={handleChange}
              style={inputStyle}
              required
            >
              <option value="">Select Entity Size</option>
              {entitySizes.map((size) => (
                <option key={size.value} value={size.value}>
                  {size.label}
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

          <FormField label="Country" required>
            <select
              name="location"
              value={formData.location || ""}
              onChange={handleChange}
              style={inputStyle}
              required
            >
              <option value="">Select Country</option>
              {africanCountries.map((country) => (
                <option key={country.value} value={country.value}>
                  {country.label}
                </option>
              ))}
            </select>
          </FormField>

          {/* City dropdown - shows when country is selected */}
          {formData.location && citiesByCountry[formData.location] && (
            <FormField label="City" required>
              <select
                name="city"
                value={formData.city || ""}
                onChange={handleChange}
                style={inputStyle}
                required
              >
                <option value="">Select City</option>
                {citiesByCountry[formData.location].map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </FormField>
          )}

          {formData.location === "South Africa" && (
            <FormField label="Province" required>
              <select
                name="province"
                value={formData.province || ""}
                onChange={handleChange}
                style={inputStyle}
                required
              >
                <option value="">Select Province</option>
                <option value="eastern_cape">Eastern Cape</option>
                <option value="free_state">Free State</option>
                <option value="gauteng">Gauteng</option>
                <option value="kwazulu_natal">KwaZulu-Natal</option>
                <option value="limpopo">Limpopo</option>
                <option value="mpumalanga">Mpumalanga</option>
                <option value="northern_cape">Northern Cape</option>
                <option value="north_west">North West</option>
                <option value="western_cape">Western Cape</option>
              </select>
            </FormField>
          )}

          <FormField label="Brief Business Description" required>
            <textarea
              name="businessDescription"
              value={formData.businessDescription || ""}
              onChange={handleChange}
              rows={4}
              style={{...inputStyle, resize: 'vertical'}}
              required
            />
          </FormField>
        </div>
      </div>
    </div>
  )
}