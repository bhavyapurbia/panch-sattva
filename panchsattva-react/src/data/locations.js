// locations.js
//==========================================================
// PANCH SATTVA - COMPREHENSIVE INDIAN STATES & CITIES DATABASE
// All 28 States and 8 Union Territories with Major Cities & Districts
//==========================================================

const INDIA_LOCATIONS = {
    "Andhra Pradesh": [
        "Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool",
        "Kakinada", "Rajahmundry", "Tirupati", "Anantapur", "Kadapa",
        "Vizianagaram", "Eluru", "Ongole", "Nandyal", "Machilipatnam",
        "Adoni", "Tenali", "Proddatur", "Chittoor", "Hindupur",
        "Bhimavaram", "Madanapalle", "Guntakal", "Dharmavaram", "Gudivada",
        "Srikakulam", "Narasaraopet", "Tadepalligudem", "Amaravati"
    ],
    "Arunachal Pradesh": [
        "Itanagar", "Naharlagun", "Pasighat", "Tawang", "Ziro",
        "Bomdila", "Tezu", "Roing", "Aalo (Along)", "Changlang",
        "Khonsa", "Seppa", "Namsai", "Bhalukpong", "Dirang"
    ],
    "Assam": [
        "Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon",
        "Tinsukia", "Tezpur", "Bongaigaon", "Karimganj", "Sivasagar",
        "Goalpara", "Barpeta", "Dhubri", "North Lakhimpur", "Diphu",
        "Hailakandi", "Lumding", "Mangaldoi", "Haflong", "Golaghat"
    ],
    "Bihar": [
        "Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia",
        "Darbhanga", "Bihar Sharif", "Arrah", "Begusarai", "Katihar",
        "Munger", "Chhapra", "Danapur", "Saharsa", "Sasaram",
        "Hajipur", "Dehri", "Bettiah", "Motihari", "Siwan",
        "Kishanganj", "Jamalpur", "Buxar", "Jehanabad", "Aurangabad",
        "Lakhisarai", "Nawada", "Samastipur", "Sitamarhi", "Madhubani"
    ],
    "Chhattisgarh": [
        "Raipur", "Bhilai", "Bilaspur", "Korba", "Rajnandgaon",
        "Jagdalpur", "Raigarh", "Ambikapur", "Durg", "Dhamtari",
        "Mahasamund", "Kanker", "Kawardha", "Chirmiri", "Bhatapara",
        "Dongargarh", "Naila Janjgir", "Tilda Newra"
    ],
    "Goa": [
        "Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda",
        "Bicholim", "Curchorem", "Cuncolim", "Canacona", "Pernem",
        "Sanquelim", "Valpoi", "Calangute", "Candolim", "Porvorim"
    ],
    "Gujarat": [
        "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar",
        "Jamnagar", "Junagadh", "Gandhinagar", "Gandhidham", "Anand",
        "Navsari", "Morbi", "Nadiad", "Surendranagar", "Bharuch",
        "Mehsana", "Bhuj", "Porbandar", "Palanpur", "Valsad",
        "Vapi", "Gondal", "Veraval", "Godhra", "Patan",
        "Dahod", "Botad", "Amreli", "Deesa", "Jetpur", "Anjar", "Modasa"
    ],
    "Haryana": [
        "Faridabad", "Gurugram", "Panipat", "Ambala", "Yamunanagar",
        "Rohtak", "Hisar", "Karnal", "Sonipat", "Panchkula",
        "Bhiwani", "Sirsa", "Bahadurgarh", "Jind", "Thanesar",
        "Kaithal", "Rewari", "Palwal", "Hansi", "Narnaul",
        "Fatehabad", "Tohana", "Pinjore", "Kurukshetra"
    ],
    "Himachal Pradesh": [
        "Shimla", "Dharamshala", "Solan", "Mandi", "Palampur",
        "Baddi", "Nahan", "Paonta Sahib", "Sundarnagar", "Kullu",
        "Manali", "Hamirpur", "Una", "Bilaspur", "Chamba",
        "Kangra", "Nurpur", "Dalhousie", "Kasauli"
    ],
    "Jharkhand": [
        "Ranchi", "Jamshedpur", "Dhanbad", "Bokaro Steel City", "Deoghar",
        "Phusro", "Hazaribagh", "Giridih", "Ramgarh", "Medininagar (Daltonganj)",
        "Chirkunda", "Jhumri Telaiya", "Sahibganj", "Chaibasa", "Gumia",
        "Dumka", "Madhupur", "Simdega", "Gumla", "Lohardaga"
    ],
    "Karnataka": [
        "Bengaluru", "Mysuru", "Hubballi-Dharwad", "Mangaluru", "Belagavi",
        "Kalaburagi (Gulbarga)", "Davanagere", "Ballari", "Vijayapura (Bijapur)",
        "Shivamogga", "Tumakuru", "Raichur", "Bidar", "Hosapete",
        "Gadag-Betageri", "Robertsonpet (KGF)", "Hassan", "Bhadravati",
        "Chitradurga", "Udupi", "Kolar", "Mandya", "Chikkamagaluru",
        "Bagalkote", "Ranebennuru", "Karwar", "Sirsi", "Madikeri"
    ],
    "Kerala": [
        "Thiruvananthapuram", "Kochi", "Kozhikode", "Kollam", "Thrissur",
        "Kannur", "Alappuzha", "Kottayam", "Palakkad", "Manjeri",
        "Thalassery", "Thrippunithura", "Ponnani", "Vatakara", "Kanhangad",
        "Payyanur", "Koyilandy", "Neyyattinkara", "Beypore", "Kayamkulam",
        "Malappuram", "Kasaragod", "Changanassery", "Pathanamthitta"
    ],
    "Madhya Pradesh": [
        "Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain",
        "Sagar", "Dewas", "Satna", "Ratlam", "Rewa",
        "Murwara (Katni)", "Singrauli", "Burhanpur", "Khandwa", "Bhind",
        "Chhindwara", "Guna", "Shivpuri", "Vidisha", "Chhatarpur",
        "Damoh", "Mandsaur", "Khargone", "Neemuch", "Pithampur",
        "Narmadapuram (Hoshangabad)", "Itarsi", "Sehore", "Morena", "Betul"
    ],
    "Maharashtra": [
        "Mumbai", "Pune", "Nagpur", "Thane", "Pimpri-Chinchwad",
        "Nashik", "Kalyan-Dombivli", "Vasai-Virar", "Aurangabad (Chhatrapati Sambhaji Nagar)",
        "Navi Mumbai", "Solapur", "Mira-Bhayandar", "Bhiwandi-Nizampur", "Amravati",
        "Nanded", "Kolhapur", "Ulhasnagar", "Sangli-Miraj", "Malegaon",
        "Jalgaon", "Akola", "Latur", "Dhule", "Ahmednagar",
        "Chandrapur", "Parbhani", "Ichalkaranji", "Jalna", "Ambarnath",
        "Bhusawal", "Panvel", "Badlapur", "Beed", "Gondia",
        "Satara", "Barshi", "Yavatmal", "Achalpur", "Osmanabad (Dharashiv)",
        "Nandurbar", "Wardha", "Udgir", "Hinganghat", "Ratnagiri", "Alibaug"
    ],
    "Manipur": [
        "Imphal", "Churachandpur", "Thoubal", "Bishnupur", "Kakching",
        "Ukhrul", "Senapati", "Moirang", "Lilong", "Tamenglong"
    ],
    "Meghalaya": [
        "Shillong", "Tura", "Nongpoh", "Jowai", "Baghmara",
        "Williamnagar", "Resubelpara", "Mairang", "Cherrapunji (Sohra)", "Dawki"
    ],
    "Mizoram": [
        "Aizawl", "Lunglei", "Saiha", "Champhai", "Kolasib",
        "Serchhip", "Lawngtlai", "Mamit", "Khawzawl", "Hnahthial"
    ],
    "Nagaland": [
        "Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha",
        "Zunheboto", "Mon", "Phek", "Chümoukedima", "Kiphire", "Longleng"
    ],
    "Odisha": [
        "Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur",
        "Puri", "Balasore", "Bhadrak", "Baripada", "Jharsuguda",
        "Jeypore", "Bargarh", "Rayagada", "Bolangir", "Dhenkanal",
        "Kendujhar", "Angul", "Sunabeda", "Paradip", "Jajpur"
    ],
    "Punjab": [
        "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda",
        "Mohali (SAS Nagar)", "Hoshiarpur", "Batala", "Pathankot", "Moga",
        "Abohar", "Malerkotla", "Khanna", "Phagwara", "Muktsar",
        "Barnala", "Firozpur", "Kapurthala", "Rajpura", "Sangrur",
        "Fazilka", "Gobindgarh", "Mansa", "Nawanshahr", "Rupnagar"
    ],
    "Rajasthan": [
        "Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer",
        "Udaipur", "Bhilwara", "Alwar", "Bharatpur", "Sikar",
        "Pali", "Sri Ganganagar", "Beawar", "Hanumangarh", "Tonk",
        "Kishangarh", "Jhunjhunu", "Banswara", "Chittorgarh", "Dausa",
        "Nagaur", "Bundi", "Jhalawar", "Sawai Madhopur", "Churu",
        "Barmer", "Jaisalmer", "Mount Abu", "Balotra", "Hindaun",
        "Sujangarh", "Gangapur City", "Makrana", "Pratapgarh", "Dungarpur"
    ],
    "Sikkim": [
        "Gangtok", "Namchi", "Geyzing", "Mangan", "Rangpo",
        "Singtam", "Jorethang", "Ravangla", "Pelling", "Lachung"
    ],
    "Tamil Nadu": [
        "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem",
        "Tiruppur", "Erode", "Tirunelveli", "Vellore", "Thoothukudi",
        "Dindigul", "Thanjavur", "Ranipet", "Sivakasi", "Karur",
        "Udhagamandalam (Ooty)", "Hosur", "Nagercoil", "Kanchipuram", "Kumarapalayam",
        "Karaikkudi", "Neyveli", "Cuddalore", "Kumbakonam", "Tiruvannamalai",
        "Pollachi", "Rajapalayam", "Gudiyatham", "Pudukkottai", "Vaniyambadi",
        "Ambur", "Nagapattinam", "Namakkal", "Theni", "Dharmapuri"
    ],
    "Telangana": [
        "Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Ramagundam",
        "Khammam", "Mahbubnagar", "Nalgonda", "Adilabad", "Suryapet",
        "Siddipet", "Miryalaguda", "Jagtial", "Mancherial", "Nirmal",
        "Kothagudem", "Bodhan", "Kamareddy", "Vikarabad", "Medak"
    ],
    "Tripura": [
        "Agartala", "Dharmanagar", "Udaipur", "Kailashahar", "Teliamura",
        "Belonia", "Khowai", "Ambassa", "Ranirbazar", "Santirbazar", "Kumarghat"
    ],
    "Uttar Pradesh": [
        "Lucknow", "Kanpur", "Ghaziabad", "Agra", "Meerut",
        "Varanasi", "Prayagraj (Allahabad)", "Bareilly", "Aligarh", "Moradabad",
        "Saharanpur", "Gorakhpur", "Noida", "Greater Noida", "Firozabad",
        "Jhansi", "Muzaffarnagar", "Mathura", "Ayodhya", "Rampur",
        "Shahjahanpur", "Farrukhabad", "Hapur", "Budaun", "Mirzapur",
        "Etawah", "Sambhal", "Amroha", "Hardoi", "Fatehpur",
        "Raebareli", "Orai", "Sitapur", "Bahraich", "Modinagar",
        "Unnao", "Jaunpur", "Lakhimpur", "Hathras", "Banda",
        "Pilibhit", "Barabanki", "Mughalsarai", "Gonda", "Mainpuri",
        "Lalitpur", "Deoria", "Ghazipur", "Sultanpur", "Azamgarh", "Basti"
    ],
    "Uttarakhand": [
        "Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur",
        "Kashipur", "Rishikesh", "Nainital", "Mussoorie", "Almora",
        "Pithoragarh", "Kotdwar", "Manglaur", "Ramnagar", "Kichha",
        "Tehri", "Pauri", "Srinagar (Garhwal)", "Vikasnagar", "Champawat"
    ],
    "West Bengal": [
        "Kolkata", "Howrah", "Asansol", "Siliguri", "Durgapur",
        "Bardhaman", "Malda", "Baharampur", "Habra", "Kharagpur",
        "Shantipur", "Dankuni", "Dhulian", "Ranaghat", "Haldia",
        "Raiganj", "Krishnanagar", "Nabadwip", "Midnapore", "Jalpaiguri",
        "Balurghat", "Basirhat", "Bankura", "Chakdaha", "Darjeeling",
        "Alipurduar", "Purulia", "Jangipur", "Bolpur", "Bangaon", "Cooch Behar"
    ],
    "Andaman and Nicobar Islands": [
        "Port Blair", "Diglipur", "Mayabunder", "Rangat", "Car Nicobar",
        "Havelock Island (Swaraj Dweep)", "Neil Island (Shaheed Dweep)"
    ],
    "Chandigarh": [
        "Chandigarh", "Sector 17", "Manimajra"
    ],
    "Dadra and Nagar Haveli and Daman and Diu": [
        "Daman", "Diu", "Silvassa", "Amli"
    ],
    "Delhi (NCT)": [
        "New Delhi", "Central Delhi", "North Delhi", "South Delhi",
        "East Delhi", "West Delhi", "North East Delhi", "North West Delhi",
        "South East Delhi", "South West Delhi", "Shahdara", "Dwarka",
        "Rohini", "Connaught Place", "Saket", "Vasant Kunj", "Karol Bagh",
        "Lajpat Nagar", "Janakpuri", "Pitampura", "Chandni Chowk", "Mayur Vihar"
    ],
    "Jammu and Kashmir": [
        "Srinagar", "Jammu", "Anantnag", "Baramulla", "Kathua",
        "Udhampur", "Sopore", "Rajouri", "Pulwama", "Kupwara",
        "Poonch", "Ganderbal", "Kulgam", "Bandipora", "Budgam",
        "Doda", "Samba", "Reasi", "Ramban", "Kishtwar"
    ],
    "Ladakh": [
        "Leh", "Kargil", "Diskit", "Nubra", "Zanskar", "Drass"
    ],
    "Lakshadweep": [
        "Kavaratti", "Agatti", "Amini", "Andrott", "Minicoy", "Kalpeni", "Kadmat", "Kiltan"
    ],
    "Puducherry": [
        "Puducherry (Pondicherry)", "Karaikal", "Mahe", "Yanam", "Ozhukarai"
    ]
};

/**
 * Initializes and synchronizes State and City Select dropdowns.
 * @param {string|HTMLSelectElement} stateSelectOrId 
 * @param {string|HTMLSelectElement} citySelectOrId 
 * @param {string|HTMLInputElement} [customCityOrId] 
 * @param {string} [initialState] 
 * @param {string} [initialCity] 
 */
function setupIndianLocationSelectors(stateSelectOrId, citySelectOrId, customCityOrId, initialState = "", initialCity = "") {
    const stateEl = typeof stateSelectOrId === "string" ? document.getElementById(stateSelectOrId) : stateSelectOrId;
    const cityEl = typeof citySelectOrId === "string" ? document.getElementById(citySelectOrId) : citySelectOrId;
    const customCityEl = customCityOrId ? (typeof customCityOrId === "string" ? document.getElementById(customCityOrId) : customCityOrId) : null;

    if (!stateEl || !cityEl) return;

    // Populate State dropdown
    stateEl.innerHTML = `<option value="">-- Select State / Union Territory --</option>`;
    const states = Object.keys(INDIA_LOCATIONS).sort();
    states.forEach(st => {
        const opt = document.createElement("option");
        opt.value = st;
        opt.textContent = st;
        stateEl.appendChild(opt);
    });

    function populateCitiesForState(stateName, preselectCity = "") {
        if (!stateName || !INDIA_LOCATIONS[stateName]) {
            cityEl.innerHTML = `<option value="">-- Select State First --</option>`;
            cityEl.disabled = true;
            if (customCityEl) {
                customCityEl.style.display = "none";
                customCityEl.value = "";
            }
            return;
        }

        cityEl.disabled = false;
        cityEl.innerHTML = `<option value="">-- Select City / District --</option>`;

        const cities = [...INDIA_LOCATIONS[stateName]].sort();
        let foundMatch = false;

        cities.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c;
            opt.textContent = c;
            if (preselectCity && preselectCity.trim().toLowerCase() === c.toLowerCase()) {
                opt.selected = true;
                foundMatch = true;
            }
            cityEl.appendChild(opt);
        });

        // Add Other (Enter City Manually)
        const otherOpt = document.createElement("option");
        otherOpt.value = "OTHER";
        otherOpt.textContent = "✏️ Other (Type City Manually)";
        cityEl.appendChild(otherOpt);

        if (preselectCity && !foundMatch) {
            otherOpt.selected = true;
            if (customCityEl) {
                customCityEl.style.display = "block";
                customCityEl.value = preselectCity;
            }
        } else if (customCityEl) {
            customCityEl.style.display = "none";
        }
    }

    stateEl.addEventListener("change", function () {
        populateCitiesForState(this.value);
    });

    cityEl.addEventListener("change", function () {
        if (this.value === "OTHER") {
            if (customCityEl) {
                customCityEl.style.display = "block";
                customCityEl.required = true;
                customCityEl.focus();
            }
        } else {
            if (customCityEl) {
                customCityEl.style.display = "none";
                customCityEl.required = false;
                customCityEl.value = "";
            }
        }
    });

    // Preselect initial values if provided
    if (initialState) {
        // Find best match in states list (case insensitive)
        const matchState = states.find(s => s.toLowerCase() === initialState.trim().toLowerCase());
        if (matchState) {
            stateEl.value = matchState;
            populateCitiesForState(matchState, initialCity);
        }
    }
}

/**
 * Returns the effective chosen city value (either from dropdown or custom text input)
 */
function getSelectedCityValue(citySelectOrId, customCityOrId) {
    const cityEl = typeof citySelectOrId === "string" ? document.getElementById(citySelectOrId) : citySelectOrId;
    const customCityEl = customCityOrId ? (typeof customCityOrId === "string" ? document.getElementById(customCityOrId) : customCityOrId) : null;

    if (!cityEl) return "";
    if (cityEl.value === "OTHER" && customCityEl) {
        return (customCityEl.value || "").trim();
    }
    return (cityEl.value || "").trim();
}

// Ensure global accessibility in all browser execution contexts
if (typeof window !== "undefined") {
    window.INDIA_LOCATIONS = INDIA_LOCATIONS;
    window.setupIndianLocationSelectors = setupIndianLocationSelectors;
    window.getSelectedCityValue = getSelectedCityValue;
}
if (typeof globalThis !== "undefined") {
    globalThis.INDIA_LOCATIONS = INDIA_LOCATIONS;
    globalThis.setupIndianLocationSelectors = setupIndianLocationSelectors;
    globalThis.getSelectedCityValue = getSelectedCityValue;
}

export { INDIA_LOCATIONS, setupIndianLocationSelectors, getSelectedCityValue };
export default INDIA_LOCATIONS;
