// Historical Philippine Typhoons Dataset
// Accurate PAGASA and JTWC historical tracks, landfalls, and meteorological metrics

const TYPHOON_HISTORY = [
  {
    id: "yolanda-2013",
    name: "Yolanda",
    internationalName: "Haiyan",
    year: 2013,
    dates: "November 6–9, 2013",
    category: "Super Typhoon",
    categoryLevel: 5,
    maxWindsKmH: 315,
    gustsKmH: 380,
    pressureHpa: 895,
    highestSignal: "Signal No. 4 (equiv. to Signal No. 5)",
    summary: "One of the most powerful tropical cyclones ever recorded in world history. Yolanda generated catastrophic storm surges up to 7 meters in San Pedro Bay and flattened Tacloban City and coastal communities across Eastern and Central Visayas.",
    affectedRegions: ["Eastern Visayas", "Central Visayas", "Western Visayas", "MIMAROPA", "Bicol"],
    affectedProvinces: ["Eastern Samar", "Leyte", "Samar", "Biliran", "Cebu", "Iloilo", "Capiz", "Aklan", "Antique", "Palawan"],
    landfalls: [
      { sequence: 1, name: "Guiuan, Eastern Samar", coordinates: [11.03, 125.72], date: "Nov 8, 4:40 AM", details: "Initial catastrophic landfall with sustained winds of 315 km/h." },
      { sequence: 2, name: "Tolosa, Leyte", coordinates: [11.06, 125.04], date: "Nov 8, 7:00 AM", details: "Triggered 5-7 meter storm surges inundating Tacloban City and surrounding towns." },
      { sequence: 3, name: "Daanbantayan, Cebu", coordinates: [11.26, 124.02], date: "Nov 8, 9:40 AM", details: "Cut off northern Cebu with extreme destructive winds." },
      { sequence: 4, name: "Bantayan Island, Cebu", coordinates: [11.17, 123.72], date: "Nov 8, 10:40 AM", details: "Nearly 90% of island structures damaged or destroyed." },
      { sequence: 5, name: "Concepcion, Iloilo", coordinates: [11.21, 123.11], date: "Nov 8, 12:00 PM", details: "Traversed northern Panay causing severe flooding and storm surge." },
      { sequence: 6, name: "Busuanga, Palawan", coordinates: [12.16, 120.10], date: "Nov 8, 8:00 PM", details: "Final Philippine landfall before exiting into the West Philippine Sea." }
    ],
    track: [
      { coordinates: [7.8, 137.0], time: "Nov 6, 06:00 UTC", stage: "Super Typhoon", windKmH: 260, pressureHpa: 925, note: "Entering Philippine Area of Responsibility" },
      { coordinates: [9.2, 133.5], time: "Nov 6, 18:00 UTC", stage: "Super Typhoon", windKmH: 285, pressureHpa: 910, note: "Rapid intensification over deep warm waters" },
      { coordinates: [10.4, 129.5], time: "Nov 7, 12:00 UTC", stage: "Super Typhoon", windKmH: 315, pressureHpa: 895, note: "Peak intensity reached east of Visayas" },
      { coordinates: [10.9, 126.8], time: "Nov 7, 18:00 UTC", stage: "Super Typhoon", windKmH: 315, pressureHpa: 895, note: "Approaching Eastern Samar coast" },
      { coordinates: [11.03, 125.72], time: "Nov 7, 20:40 UTC", stage: "Landfall 1", windKmH: 315, pressureHpa: 895, note: "Landfall at Guiuan, Eastern Samar" },
      { coordinates: [11.06, 125.04], time: "Nov 7, 23:00 UTC", stage: "Landfall 2", windKmH: 305, pressureHpa: 900, note: "Landfall at Tolosa / Tacloban, Leyte" },
      { coordinates: [11.26, 124.02], time: "Nov 8, 01:40 UTC", stage: "Landfall 3", windKmH: 280, pressureHpa: 910, note: "Landfall at Daanbantayan, Northern Cebu" },
      { coordinates: [11.17, 123.72], time: "Nov 8, 02:40 UTC", stage: "Landfall 4", windKmH: 270, pressureHpa: 915, note: "Landfall at Bantayan Island, Cebu" },
      { coordinates: [11.21, 123.11], time: "Nov 8, 04:00 UTC", stage: "Landfall 5", windKmH: 260, pressureHpa: 920, note: "Landfall at Concepcion, Northern Iloilo" },
      { coordinates: [11.60, 121.80], time: "Nov 8, 08:00 UTC", stage: "Super Typhoon", windKmH: 240, pressureHpa: 930, note: "Traversing Mindoro Strait" },
      { coordinates: [12.16, 120.10], time: "Nov 8, 12:00 UTC", stage: "Landfall 6", windKmH: 230, pressureHpa: 935, note: "Landfall at Busuanga Island, Palawan" },
      { coordinates: [13.40, 117.20], time: "Nov 9, 00:00 UTC", stage: "Typhoon", windKmH: 205, pressureHpa: 945, note: "Exiting into West Philippine Sea" }
    ],
    impactMetrics: {
      casualties: "6,300+ confirmed fatalities",
      damageCost: "₱95.5 Billion (USD 2.2B)",
      familiesAffected: "3.4 Million families across 44 provinces",
      stormSurge: "5.0 to 7.0 meters (San Pedro Bay)"
    },
    preparednessLessons: [
      "The term 'storm surge' was misunderstood as simple sea waves; coastal communities now receive explicit surge inundation warnings.",
      "Pre-emptive evacuation from coastlines to sturdy elevated centers is mandatory.",
      "Resilient communication systems (satellite and VHF) are critical when cellular towers collapse."
    ]
  },
  {
    id: "odette-2021",
    name: "Odette",
    internationalName: "Rai",
    year: 2021,
    dates: "December 16–18, 2021",
    category: "Super Typhoon",
    categoryLevel: 5,
    maxWindsKmH: 280,
    gustsKmH: 340,
    pressureHpa: 915,
    highestSignal: "Signal No. 4 (Bohol, Cebu, Leyte)",
    summary: "Odette underwent explosive rapid intensification just hours before striking Siargao Island, becoming a Category 5 Super Typhoon. It made a staggering nine landfalls across the Visayas and Palawan, knocking out power across entire provinces for months.",
    affectedRegions: ["Caraga", "Eastern Visayas", "Central Visayas", "Western Visayas", "MIMAROPA"],
    affectedProvinces: ["Surigao del Norte", "Dinagat Islands", "Southern Leyte", "Bohol", "Cebu", "Negros Oriental", "Negros Occidental", "Palawan"],
    landfalls: [
      { sequence: 1, name: "Siargao Island, Surigao del Norte", coordinates: [9.87, 126.05], date: "Dec 16, 1:30 PM", details: "First landfall with explosive Cat 5 intensity; total coastal devastation." },
      { sequence: 2, name: "Cagdianao, Dinagat Islands", coordinates: [10.02, 125.68], date: "Dec 16, 3:10 PM", details: "Severed all communications and power in Dinagat." },
      { sequence: 3, name: "Liloan, Southern Leyte", coordinates: [10.16, 125.13], date: "Dec 16, 4:50 PM", details: "Panaon Island passage with torrential rain." },
      { sequence: 4, name: "Padre Burgos, Southern Leyte", coordinates: [10.10, 125.02], date: "Dec 16, 5:40 PM", details: "Sogod Bay crossing causing massive storm surges." },
      { sequence: 5, name: "Pres. Carlos P. Garcia, Bohol", coordinates: [10.12, 124.56], date: "Dec 16, 6:30 PM", details: "Struck northern Bohol islands." },
      { sequence: 6, name: "Ubay, Bohol", coordinates: [10.06, 124.47], date: "Dec 16, 7:30 PM", details: "Catastrophic roof damage and power grid collapse across Bohol." },
      { sequence: 7, name: "Carcar City, Cebu", coordinates: [10.11, 123.64], date: "Dec 16, 10:00 PM", details: "Cut through southern and central Cebu, devastating Cebu City infrastructure." },
      { sequence: 8, name: "La Libertad, Negros Oriental", coordinates: [10.02, 123.23], date: "Dec 17, 12:00 AM", details: "Crossed Negros Island overnight with intense flash flooding." },
      { sequence: 9, name: "Roxas, Palawan", coordinates: [10.32, 119.34], date: "Dec 17, 3:10 PM", details: "Ninth and final landfall, heavily damaging central Palawan." }
    ],
    track: [
      { coordinates: [8.5, 134.0], time: "Dec 15, 12:00 UTC", stage: "Typhoon", windKmH: 155, pressureHpa: 965, note: "Approaching PAR with steady movement" },
      { coordinates: [9.1, 130.5], time: "Dec 16, 00:00 UTC", stage: "Super Typhoon", windKmH: 260, pressureHpa: 925, note: "Explosive rapid intensification east of Surigao" },
      { coordinates: [9.87, 126.05], time: "Dec 16, 05:30 UTC", stage: "Landfall 1", windKmH: 280, pressureHpa: 915, note: "Landfall over Siargao Island" },
      { coordinates: [10.02, 125.68], time: "Dec 16, 07:10 UTC", stage: "Landfall 2", windKmH: 260, pressureHpa: 925, note: "Landfall over Dinagat Islands" },
      { coordinates: [10.16, 125.13], time: "Dec 16, 08:50 UTC", stage: "Landfall 3", windKmH: 240, pressureHpa: 935, note: "Landfall over Southern Leyte" },
      { coordinates: [10.06, 124.47], time: "Dec 16, 11:30 UTC", stage: "Landfall 6", windKmH: 220, pressureHpa: 940, note: "Landfall over Ubay, Bohol" },
      { coordinates: [10.11, 123.64], time: "Dec 16, 14:00 UTC", stage: "Landfall 7", windKmH: 210, pressureHpa: 945, note: "Landfall over Carcar, Cebu" },
      { coordinates: [10.02, 123.23], time: "Dec 16, 16:00 UTC", stage: "Landfall 8", windKmH: 195, pressureHpa: 955, note: "Landfall over Negros Oriental" },
      { coordinates: [10.20, 121.20], time: "Dec 17, 02:00 UTC", stage: "Typhoon", windKmH: 185, pressureHpa: 960, note: "Crossing the Sulu Sea toward Palawan" },
      { coordinates: [10.32, 119.34], time: "Dec 17, 07:10 UTC", stage: "Landfall 9", windKmH: 180, pressureHpa: 965, note: "Landfall over Roxas, Palawan" },
      { coordinates: [11.10, 116.20], time: "Dec 18, 00:00 UTC", stage: "Typhoon", windKmH: 195, pressureHpa: 955, note: "Exiting PAR into West Philippine Sea" }
    ],
    impactMetrics: {
      casualties: "400+ fatalities",
      damageCost: "₱51.8 Billion",
      familiesAffected: "2.4 Million families",
      stormSurge: "3.0 to 4.5 meters (Siargao, Dinagat, Southern Leyte)"
    },
    preparednessLessons: [
      "Rapid intensification close to coastline gives mere hours to evacuate; readiness must begin 48-72 hours earlier.",
      "Hardened off-grid power backups (solar generators) are indispensable for emergency operations centers.",
      "Multi-province island supply chains need redundant maritime relief corridors."
    ]
  },
  {
    id: "rolly-2020",
    name: "Rolly",
    internationalName: "Goni",
    year: 2020,
    dates: "October 31 – November 1, 2020",
    category: "Super Typhoon",
    categoryLevel: 5,
    maxWindsKmH: 315,
    gustsKmH: 360,
    pressureHpa: 905,
    highestSignal: "Signal No. 5 (Catanduanes, Albay)",
    summary: "The strongest tropical cyclone worldwide in 2020, Rolly made its first landfall in Bato, Catanduanes at 315 km/h peak winds. It triggered devastating lahar flows from Mayon Volcano and swept through the Bicol peninsula before weakening over Southern Tagalog.",
    affectedRegions: ["Bicol Region", "CALABARZON", "MIMAROPA", "Central Luzon", "Metro Manila"],
    affectedProvinces: ["Catanduanes", "Albay", "Camarines Sur", "Camarines Norte", "Quezon", "Marinduque", "Batangas"],
    landfalls: [
      { sequence: 1, name: "Bato, Catanduanes", coordinates: [13.61, 124.28], date: "Nov 1, 4:50 AM", details: "Peak Cat 5 landfall with devastating winds and massive wave action." },
      { sequence: 2, name: "Tiwi, Albay", coordinates: [13.46, 123.68], date: "Nov 1, 8:20 AM", details: "Triggered deadly volcanic lahar and mudflows from Mayon Volcano." },
      { sequence: 3, name: "San Narciso, Quezon", coordinates: [13.57, 122.57], date: "Nov 1, 12:00 PM", details: "Bondoc Peninsula landfall; weakened by mountainous terrain." },
      { sequence: 4, name: "Torrijos, Marinduque", coordinates: [13.32, 122.09], date: "Nov 1, 5:30 PM", details: "Final landfall before entering the Verde Island Passage." }
    ],
    track: [
      { coordinates: [15.3, 134.5], time: "Oct 30, 06:00 UTC", stage: "Typhoon", windKmH: 195, pressureHpa: 960, note: "Entering PAR with explosive intensification" },
      { coordinates: [14.8, 130.2], time: "Oct 31, 00:00 UTC", stage: "Super Typhoon", windKmH: 295, pressureHpa: 910, note: "Category 5 Super Typhoon intensity" },
      { coordinates: [13.9, 126.8], time: "Oct 31, 18:00 UTC", stage: "Super Typhoon", windKmH: 315, pressureHpa: 905, note: "Peak wind velocity achieved" },
      { coordinates: [13.61, 124.28], time: "Oct 31, 20:50 UTC", stage: "Landfall 1", windKmH: 315, pressureHpa: 905, note: "Landfall at Bato, Catanduanes" },
      { coordinates: [13.46, 123.68], time: "Nov 1, 00:20 UTC", stage: "Landfall 2", windKmH: 260, pressureHpa: 925, note: "Landfall at Tiwi, Albay" },
      { coordinates: [13.57, 122.57], time: "Nov 1, 04:00 UTC", stage: "Landfall 3", windKmH: 205, pressureHpa: 950, note: "Landfall at San Narciso, Quezon" },
      { coordinates: [13.32, 122.09], time: "Nov 1, 09:30 UTC", stage: "Landfall 4", windKmH: 165, pressureHpa: 970, note: "Landfall at Torrijos, Marinduque" },
      { coordinates: [13.80, 120.40], time: "Nov 1, 18:00 UTC", stage: "Tropical Storm", windKmH: 110, pressureHpa: 990, note: "Exiting Batangas coast into West PH Sea" }
    ],
    impactMetrics: {
      casualties: "32 fatalities (low casualty rate credited to pre-emptive evacuation)",
      damageCost: "₱20.0 Billion",
      familiesAffected: "800,000+ families",
      stormSurge: "3.5 to 5.0 meters (Catanduanes, Camarines Sur)"
    },
    preparednessLessons: [
      "Timely pre-emptive evacuation of 400,000+ residents in Bicol saved thousands of lives despite Cat 5 winds.",
      "Communities near active volcanoes must account for lahar hazards during intense typhoon downpours.",
      "Undergrounding of power and fiber lines in high-frequency strike zones is essential."
    ]
  },
  {
    id: "pepito-2024",
    name: "Pepito",
    internationalName: "Man-yi",
    year: 2024,
    dates: "November 16–18, 2024",
    category: "Super Typhoon",
    categoryLevel: 5,
    maxWindsKmH: 260,
    gustsKmH: 325,
    pressureHpa: 920,
    highestSignal: "Signal No. 5 (Catanduanes, Aurora, Quirino, Polillo)",
    summary: "Pepito was the culmination of an unprecedented succession of six tropical cyclones that struck the Philippines within three weeks in late 2024. Reaching Super Typhoon status with a compact, violent core, Pepito hammered Catanduanes and swept through Central and Northern Luzon.",
    affectedRegions: ["Bicol Region", "Central Luzon", "Cagayan Valley", "Cordillera", "Ilocos Region"],
    affectedProvinces: ["Catanduanes", "Aurora", "Nueva Ecija", "Nueva Vizcaya", "Quirino", "Ifugao", "Benguet", "La Union", "Pangasinan"],
    landfalls: [
      { sequence: 1, name: "Panganiban, Catanduanes", coordinates: [13.90, 124.30], date: "Nov 16, 9:40 PM", details: "Cat 5 landfall that shredded buildings and leveled power infrastructure across the island." },
      { sequence: 2, name: "Dipaculao, Aurora", coordinates: [15.83, 121.63], date: "Nov 17, 3:20 PM", details: "Second landfall as a high-end Super Typhoon, driving storm surges into coastal Aurora." }
    ],
    track: [
      { coordinates: [11.8, 131.5], time: "Nov 15, 12:00 UTC", stage: "Typhoon", windKmH: 175, pressureHpa: 965, note: "Tracking rapidly west-northwest in PAR" },
      { coordinates: [13.2, 126.8], time: "Nov 16, 06:00 UTC", stage: "Super Typhoon", windKmH: 260, pressureHpa: 920, note: "Peak intensity achieved east of Bicol" },
      { coordinates: [13.90, 124.30], time: "Nov 16, 13:40 UTC", stage: "Landfall 1", windKmH: 260, pressureHpa: 920, note: "Landfall over Panganiban, Catanduanes" },
      { coordinates: [14.80, 123.10], time: "Nov 17, 00:00 UTC", stage: "Super Typhoon", windKmH: 230, pressureHpa: 935, note: "Passing north of Polillo Islands" },
      { coordinates: [15.83, 121.63], time: "Nov 17, 07:20 UTC", stage: "Landfall 2", windKmH: 215, pressureHpa: 940, note: "Landfall over Dipaculao, Aurora" },
      { coordinates: [16.30, 120.90], time: "Nov 17, 12:00 UTC", stage: "Typhoon", windKmH: 165, pressureHpa: 965, note: "Crossing Caraballo Mountains and Southern Cordillera" },
      { coordinates: [16.80, 119.80], time: "Nov 17, 18:00 UTC", stage: "Typhoon", windKmH: 140, pressureHpa: 975, note: "Emerging over the coastal waters of La Union" },
      { coordinates: [17.50, 117.00], time: "Nov 18, 06:00 UTC", stage: "Severe Tropical Storm", windKmH: 110, pressureHpa: 985, note: "Exiting PAR towards the South China Sea" }
    ],
    impactMetrics: {
      casualties: "12 fatalities (reduced through massive forced evacuations)",
      damageCost: "₱12.6 Billion",
      familiesAffected: "1.1 Million families",
      stormSurge: "3.0 to 4.5 meters (Catanduanes, Aurora coastlines)"
    },
    preparednessLessons: [
      "Consecutive back-to-back storms compound saturation; ground that held in storm 1 easily gives way to landslides by storm 4.",
      "Pre-emptive forced evacuation enforced by police and military saved thousands along the Aurora-Catanduanes coastline.",
      "Dam water releases (Magat, Binga, Ambuklao) must be synchronized transparently with downstream communities."
    ]
  },
  {
    id: "kristine-2024",
    name: "Kristine",
    internationalName: "Trami",
    year: 2024,
    dates: "October 22–25, 2024",
    category: "Severe Tropical Storm",
    categoryLevel: 3,
    maxWindsKmH: 110,
    gustsKmH: 150,
    pressureHpa: 980,
    highestSignal: "Signal No. 3",
    summary: "While not a Super Typhoon by wind speed, Kristine had an extraordinarily wide circulation that dumped catastrophic, historic rainfall across the Bicol Region (surpassing monthly rainfall records in 24 hours), causing unprecedented flooding in Naga City and deadly mudslides in Batangas.",
    affectedRegions: ["Bicol Region", "CALABARZON", "Central Luzon", "Cagayan Valley", "Ilocos Region"],
    affectedProvinces: ["Camarines Sur", "Albay", "Camarines Norte", "Sorsogon", "Batangas", "Laguna", "Isabela", "Ilocos Sur"],
    landfalls: [
      { sequence: 1, name: "Divilacan, Isabela", coordinates: [17.34, 122.30], date: "Oct 24, 12:30 AM", details: "Landfall in northeast Luzon, traversing the Sierra Madre mountains." }
    ],
    track: [
      { coordinates: [13.2, 130.0], time: "Oct 21, 18:00 UTC", stage: "Tropical Depression", windKmH: 55, pressureHpa: 998, note: "Formed east of Bicol Region" },
      { coordinates: [13.9, 126.5], time: "Oct 22, 12:00 UTC", stage: "Tropical Storm", windKmH: 75, pressureHpa: 990, note: "Pumping immense moisture into Bicol and Quezon" },
      { coordinates: [14.8, 124.5], time: "Oct 23, 06:00 UTC", stage: "Severe Tropical Storm", windKmH: 95, pressureHpa: 985, note: "Massive feeder bands inundating Naga City" },
      { coordinates: [16.2, 123.5], time: "Oct 23, 18:00 UTC", stage: "Severe Tropical Storm", windKmH: 110, pressureHpa: 980, note: "Approaching Isabela coastline" },
      { coordinates: [17.34, 122.30], time: "Oct 23, 16:30 UTC", stage: "Landfall 1", windKmH: 110, pressureHpa: 980, note: "Landfall at Divilacan, Isabela" },
      { coordinates: [17.10, 121.20], time: "Oct 24, 02:00 UTC", stage: "Severe Tropical Storm", windKmH: 95, pressureHpa: 985, note: "Crossing Northern Luzon terrain" },
      { coordinates: [17.20, 119.80], time: "Oct 24, 08:00 UTC", stage: "Severe Tropical Storm", windKmH: 100, pressureHpa: 980, note: "Emerging over coastal waters of Ilocos Sur" },
      { coordinates: [17.00, 116.50], time: "Oct 25, 00:00 UTC", stage: "Severe Tropical Storm", windKmH: 110, pressureHpa: 980, note: "West Philippine Sea heading towards Vietnam" }
    ],
    impactMetrics: {
      casualties: "160+ fatalities (primarily due to deep floods in Bicol and mudslides in Batangas)",
      damageCost: "₱17.6 Billion",
      familiesAffected: "2.2 Million families",
      stormSurge: "1.5 to 2.5 meters (Isabela, Aurora)"
    },
    preparednessLessons: [
      "Rainfall volume and storm diameter can be far more catastrophic than maximum wind speed.",
      "Urban drainage systems designed for 20th-century benchmarks fail completely under 500mm+ 24-hr rainfall events.",
      "Inland rubber rescue boats and high-clearance military trucks must be pre-positioned inland, not just in coastal LGUs."
    ]
  },
  {
    id: "ulysses-2020",
    name: "Ulysses",
    internationalName: "Vamco",
    year: 2020,
    dates: "November 11–13, 2020",
    category: "Typhoon",
    categoryLevel: 4,
    maxWindsKmH: 215,
    gustsKmH: 260,
    pressureHpa: 955,
    highestSignal: "Signal No. 3 (Metro Manila, Central Luzon, CALABARZON)",
    summary: "Striking just days after Super Typhoon Rolly, Ulysses brought severe wind and extreme rainfall that filled reservoirs to capacity. It forced emergency dam releases that inundated the entire Cagayan Valley and caused Marikina River to reach 22 meters, exceeding Ondoy levels.",
    affectedRegions: ["CALABARZON", "Metro Manila", "Central Luzon", "Cagayan Valley", "Bicol Region"],
    affectedProvinces: ["Quezon", "Rizal", "Metro Manila", "Bulacan", "Pampanga", "Cagayan", "Isabela"],
    landfalls: [
      { sequence: 1, name: "Patnanungan, Quezon", coordinates: [14.78, 122.18], date: "Nov 11, 10:30 PM", details: "First landfall across the Polillo group of islands." },
      { sequence: 2, name: "Burdeos, Polillo Island", coordinates: [14.85, 121.97], date: "Nov 11, 11:20 PM", details: "Second landfall with destructive Category 4 winds." },
      { sequence: 3, name: "General Nakar, Quezon", coordinates: [14.77, 121.64], date: "Nov 12, 1:40 AM", details: "Mainland Luzon landfall; traversed directly over Rizal and Metro Manila." }
    ],
    track: [
      { coordinates: [13.8, 128.5], time: "Nov 10, 18:00 UTC", stage: "Severe Tropical Storm", windKmH: 110, pressureHpa: 980, note: "Approaching Philippine landmass" },
      { coordinates: [14.4, 125.0], time: "Nov 11, 06:00 UTC", stage: "Typhoon", windKmH: 165, pressureHpa: 965, note: "Rapidly intensifying east of Polillo" },
      { coordinates: [14.78, 122.18], time: "Nov 11, 14:30 UTC", stage: "Landfall 1", windKmH: 215, pressureHpa: 955, note: "Landfall at Patnanungan, Quezon" },
      { coordinates: [14.85, 121.97], time: "Nov 11, 15:20 UTC", stage: "Landfall 2", windKmH: 210, pressureHpa: 955, note: "Landfall at Burdeos, Polillo Island" },
      { coordinates: [14.77, 121.64], time: "Nov 11, 17:40 UTC", stage: "Landfall 3", windKmH: 195, pressureHpa: 960, note: "Landfall at General Nakar, Quezon" },
      { coordinates: [14.70, 121.05], time: "Nov 11, 21:00 UTC", stage: "Typhoon", windKmH: 155, pressureHpa: 970, note: "Passing directly over Metro Manila (Marikina, QC)" },
      { coordinates: [14.80, 120.30], time: "Nov 12, 02:00 UTC", stage: "Typhoon", windKmH: 140, pressureHpa: 975, note: "Emerging over Bataan coastal waters" },
      { coordinates: [15.20, 116.80], time: "Nov 12, 18:00 UTC", stage: "Typhoon", windKmH: 165, pressureHpa: 965, note: "West Philippine Sea heading towards Vietnam" }
    ],
    impactMetrics: {
      casualties: "102 fatalities",
      damageCost: "₱20.3 Billion",
      familiesAffected: "1.2 Million families",
      stormSurge: "1.0 to 2.5 meters (Lamit Bay, Polillo)"
    },
    preparednessLessons: [
      "Dam discharge protocols require integrated basin-wide water release scheduling rather than localized emergency gates opening.",
      "Urban flood alarms and rooftop rescue protocols in Marikina saved thousands of trapped families.",
      "Successive storms saturate river basins, causing massive delayed flooding days after rain stops."
    ]
  },
  {
    id: "ondoy-2009",
    name: "Ondoy",
    internationalName: "Ketsana",
    year: 2009,
    dates: "September 24–27, 2009",
    category: "Typhoon",
    categoryLevel: 2,
    maxWindsKmH: 130,
    gustsKmH: 160,
    pressureHpa: 980,
    highestSignal: "Signal No. 2",
    summary: "A benchmark disaster in Philippine history: Ondoy dumped an astonishing 455 mm of rain in just 24 hours over Metro Manila—surpassing the month's entire rainfall in 6 hours. Over 80% of Metro Manila and surrounding provinces were submerged.",
    affectedRegions: ["Metro Manila", "CALABARZON", "Central Luzon"],
    affectedProvinces: ["Metro Manila", "Rizal", "Bulacan", "Laguna", "Pampanga", "Aurora"],
    landfalls: [
      { sequence: 1, name: "Baler / Dingalan border, Aurora", coordinates: [15.65, 121.56], date: "Sep 26, 8:00 AM", details: "Landfall in Central Luzon as a tropical storm; moisture convergence produced catastrophic rainfall." }
    ],
    track: [
      { coordinates: [12.5, 129.5], time: "Sep 24, 12:00 UTC", stage: "Tropical Depression", windKmH: 55, pressureHpa: 1000, note: "Formed east of Bicol" },
      { coordinates: [14.0, 125.5], time: "Sep 25, 06:00 UTC", stage: "Tropical Storm", windKmH: 75, pressureHpa: 994, note: "Moving steadily west towards Central Luzon" },
      { coordinates: [15.65, 121.56], time: "Sep 26, 00:00 UTC", stage: "Landfall 1", windKmH: 105, pressureHpa: 985, note: "Landfall over Aurora coast" },
      { coordinates: [15.10, 121.00], time: "Sep 26, 06:00 UTC", stage: "Tropical Storm", windKmH: 95, pressureHpa: 988, note: "Passing Bulacan / Rizal / Metro Manila" },
      { coordinates: [14.70, 120.30], time: "Sep 26, 12:00 UTC", stage: "Tropical Storm", windKmH: 90, pressureHpa: 990, note: "Exiting into Subic Bay" },
      { coordinates: [14.80, 117.50], time: "Sep 27, 00:00 UTC", stage: "Typhoon", windKmH: 130, pressureHpa: 980, note: "Intensified into Typhoon over West PH Sea" }
    ],
    impactMetrics: {
      casualties: "740+ fatalities (combined Ondoy & Pepeng)",
      damageCost: "₱11.0 Billion",
      familiesAffected: "990,000+ families",
      stormSurge: "Minor surge; primarily an extreme inland precipitation disaster"
    },
    preparednessLessons: [
      "Led to the historic enactment of the Philippine Disaster Risk Reduction and Management Act (RA 10121).",
      "Created Project NOAH to provide live flood hazard maps and high-resolution weather telemetry.",
      "Established the public awareness of 24-hr rainfall volume warnings (Color-coded Red/Orange/Yellow warnings)."
    ]
  },
  {
    id: "ompong-2018",
    name: "Ompong",
    internationalName: "Mangkhut",
    year: 2018,
    dates: "September 12–15, 2018",
    category: "Super Typhoon",
    categoryLevel: 5,
    maxWindsKmH: 285,
    gustsKmH: 330,
    pressureHpa: 905,
    highestSignal: "Signal No. 4 / No. 5 (Cagayan, Isabela, Ilocos)",
    summary: "A massive, powerful Super Typhoon with a cloud diameter spanning 900 kilometers. Ompong made landfall in Baggao, Cagayan, unleashing severe destructive winds across Northern Luzon and triggering catastrophic landslides in Itogon, Benguet.",
    affectedRegions: ["Cagayan Valley", "Cordillera", "Ilocos Region", "Central Luzon"],
    affectedProvinces: ["Cagayan", "Isabela", "Apayao", "Kalinga", "Benguet", "Ilocos Norte", "Ilocos Sur", "Abra"],
    landfalls: [
      { sequence: 1, name: "Baggao, Cagayan", coordinates: [17.99, 121.87], date: "Sep 15, 1:40 AM", details: "Landfall as Category 5 Super Typhoon with ferocious winds." }
    ],
    track: [
      { coordinates: [14.5, 131.0], time: "Sep 13, 00:00 UTC", stage: "Super Typhoon", windKmH: 285, pressureHpa: 905, note: "Tracking west-northwest through PAR" },
      { coordinates: [16.5, 126.5], time: "Sep 14, 06:00 UTC", stage: "Super Typhoon", windKmH: 280, pressureHpa: 910, note: "Approaching Northern Luzon coast" },
      { coordinates: [17.99, 121.87], time: "Sep 14, 17:40 UTC", stage: "Landfall 1", windKmH: 270, pressureHpa: 915, note: "Landfall at Baggao, Cagayan" },
      { coordinates: [18.20, 121.10], time: "Sep 14, 21:00 UTC", stage: "Super Typhoon", windKmH: 240, pressureHpa: 925, note: "Traversing Apayao and Mountain Province" },
      { coordinates: [18.50, 120.40], time: "Sep 15, 03:00 UTC", stage: "Typhoon", windKmH: 215, pressureHpa: 935, note: "Exiting Ilocos Norte coastline into West PH Sea" },
      { coordinates: [19.80, 116.50], time: "Sep 15, 18:00 UTC", stage: "Typhoon", windKmH: 195, pressureHpa: 945, note: "En route to Hong Kong and Southern China" }
    ],
    impactMetrics: {
      casualties: "127 fatalities (majority from Itogon, Benguet mining campsite landslide)",
      damageCost: "₱33.9 Billion",
      familiesAffected: "730,000+ families",
      stormSurge: "4.0 to 6.0 meters (Aparri and northern Cagayan coast)"
    },
    preparednessLessons: [
      "Steep mountain slopes in mining areas must be evacuated unconditionally when rainfall alerts exceed red thresholds.",
      "Agricultural buffer stocks: Ompong devastated the rice and corn capital of the Philippines just before harvest season.",
      "Storm tracking radars in Aparri and Virac need high-spec wind hardening to maintain real-time telemetry."
    ]
  },
  {
    id: "pablo-2012",
    name: "Pablo",
    internationalName: "Bopha",
    year: 2012,
    dates: "December 2–5, 2012",
    category: "Super Typhoon",
    categoryLevel: 5,
    maxWindsKmH: 280,
    gustsKmH: 315,
    pressureHpa: 918,
    highestSignal: "Signal No. 3 / No. 4 (Davao Oriental, Compostela Valley)",
    summary: "One of the most anomalous and deadly typhoons on record, Pablo struck southern Mindanao—a region historically considered outside the Philippine typhoon belt. It created catastrophic debris flows and flash floods in New Bataan and Baganga.",
    affectedRegions: ["Davao Region", "Caraga", "Northern Mindanao", "Central Visayas"],
    affectedProvinces: ["Davao Oriental", "Davao de Oro (Compostela Valley)", "Bukidnon", "Misamis Oriental", "Surigao del Sur", "Negros Oriental"],
    landfalls: [
      { sequence: 1, name: "Baganga, Davao Oriental", coordinates: [7.57, 126.56], date: "Dec 4, 4:45 AM", details: "Unprecedented Cat 5 strike in southern Mindanao; completely leveled seaside towns." },
      { sequence: 2, name: "Maramag, Bukidnon", coordinates: [7.76, 125.00], date: "Dec 4, 10:00 AM", details: "Crossed central Mindanao mountain ranges." },
      { sequence: 3, name: "Dumaguete, Negros Oriental", coordinates: [9.31, 123.31], date: "Dec 4, 4:00 PM", details: "Visayas landfall after crossing Bohol Sea." }
    ],
    track: [
      { coordinates: [6.2, 132.5], time: "Dec 3, 06:00 UTC", stage: "Super Typhoon", windKmH: 280, pressureHpa: 918, note: "Approaching southern Mindanao at an unusually low latitude (6°N)" },
      { coordinates: [7.1, 128.5], time: "Dec 3, 18:00 UTC", stage: "Super Typhoon", windKmH: 280, pressureHpa: 918, note: "Directly targeting Davao Oriental" },
      { coordinates: [7.57, 126.56], time: "Dec 3, 20:45 UTC", stage: "Landfall 1", windKmH: 280, pressureHpa: 918, note: "Landfall at Baganga, Davao Oriental" },
      { coordinates: [7.65, 125.80], time: "Dec 4, 01:00 UTC", stage: "Super Typhoon", windKmH: 250, pressureHpa: 930, note: "Disastrous flash flooding in New Bataan, Compostela Valley" },
      { coordinates: [7.76, 125.00], time: "Dec 4, 02:00 UTC", stage: "Landfall 2", windKmH: 210, pressureHpa: 945, note: "Landfall in Maramag, Bukidnon" },
      { coordinates: [8.50, 124.30], time: "Dec 4, 06:00 UTC", stage: "Typhoon", windKmH: 180, pressureHpa: 960, note: "Traversing Iligan Bay into Bohol Sea" },
      { coordinates: [9.31, 123.31], time: "Dec 4, 08:00 UTC", stage: "Landfall 3", windKmH: 160, pressureHpa: 970, note: "Landfall at Dumaguete, Negros Oriental" },
      { coordinates: [10.50, 119.50], time: "Dec 4, 21:00 UTC", stage: "Typhoon", windKmH: 140, pressureHpa: 975, note: "Crossed northern Palawan into West PH Sea" }
    ],
    impactMetrics: {
      casualties: "1,900+ dead or missing",
      damageCost: "₱43.2 Billion",
      familiesAffected: "710,000+ families",
      stormSurge: "3.0 to 4.0 meters (Baganga and Cateel coasts)"
    },
    preparednessLessons: [
      "Proved that no region in the Philippines is completely immune to super typhoons due to climate variability.",
      "Debris flows from heavily logged or deforested slopes can wipe out entire towns in minutes.",
      "Building codes in historically non-typhoon regions must be updated to withstand high-velocity wind loads."
    ]
  },
  {
    id: "carina-2024",
    name: "Carina",
    internationalName: "Gaemi",
    year: 2024,
    dates: "July 22–25, 2024",
    category: "Super Typhoon",
    categoryLevel: 5,
    maxWindsKmH: 220,
    gustsKmH: 270,
    pressureHpa: 930,
    highestSignal: "Signal No. 2 (offshore Batanes/Babuyan)",
    summary: "Although Carina did not make landfall on the Philippine mainland, its intense cyclonic circulation supercharged the Southwest Monsoon (Habagat), unleashing continuous biblical downpours across Metro Manila, Rizal, and Central Luzon that paralyzed the capital region and caused a State of Calamity.",
    affectedRegions: ["Metro Manila", "Central Luzon", "CALABARZON", "Ilocos Region", "Batanes"],
    affectedProvinces: ["Metro Manila", "Rizal", "Bulacan", "Bataan", "Pampanga", "Batangas", "Cavite", "Batanes"],
    landfalls: [],
    track: [
      { coordinates: [15.5, 125.8], time: "Jul 21, 18:00 UTC", stage: "Tropical Storm", windKmH: 85, pressureHpa: 990, note: "Tracking north in Philippine Sea" },
      { coordinates: [17.5, 125.0], time: "Jul 22, 12:00 UTC", stage: "Typhoon", windKmH: 140, pressureHpa: 970, note: "Intensifying offshore east of Isabela" },
      { coordinates: [19.2, 124.3], time: "Jul 23, 06:00 UTC", stage: "Super Typhoon", windKmH: 220, pressureHpa: 930, note: "Peak intensity; sucking massive moisture over Metro Manila" },
      { coordinates: [21.0, 123.5], time: "Jul 24, 00:00 UTC", stage: "Super Typhoon", windKmH: 220, pressureHpa: 930, note: "Passage east of Batanes archipelago" },
      { coordinates: [23.8, 121.7], time: "Jul 24, 16:00 UTC", stage: "Super Typhoon", windKmH: 205, pressureHpa: 940, note: "Landfall in Taiwan; continuing Habagat deluge over Luzon" },
      { coordinates: [25.5, 119.5], time: "Jul 25, 12:00 UTC", stage: "Typhoon", windKmH: 150, pressureHpa: 965, note: "Exited PAR towards mainland China" }
    ],
    impactMetrics: {
      casualties: "48 fatalities",
      damageCost: "₱15.5 Billion",
      familiesAffected: "1.4 Million families across 10 regions",
      stormSurge: "Monsoonal sea swell and king tides along Manila Bay"
    },
    preparednessLessons: [
      "A typhoon does not need to hit land to cause catastrophic nationwide disasters; the southwest monsoon (Habagat) interaction can be deadlier than wind.",
      "High tide synchronicity with rainfall dams river mouths, trapping floodwaters in urban lowlands like Malabon and Navotas.",
      "Real-time pumping station telemetry and urban trash interceptors are crucial."
    ]
  }
];

module.exports = { TYPHOON_HISTORY };
