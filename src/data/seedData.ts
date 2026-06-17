export interface Course {
  code: string;
  nameEn: string;
  nameAr: string;
  credits: number;
  prerequisite: string | null;
  type: 'compulsory' | 'elective' | 'free_optional' | 'training' | 'research';
}

export interface SemesterData {
  semesterId: 1 | 2;
  semesterNameAr: string;
  compulsoryCourseIds: string[];
  electiveCourseIds: string[];
  freeOptionalCourseIds: string[];
  hasTraining?: boolean;
  hasResearch?: boolean;
}

export interface LevelData {
  levelId: 2 | 3 | 4;
  levelNameAr: string;
  semesters: SemesterData[];
}

export interface Department {
  id: string;
  nameAr: string;
  nameEn: string;
  levels: LevelData[];
}

export interface Faculty {
  id: string;
  nameAr: string;
  nameEn: string;
  departments: Department[];
}

/* ─────────────────────────────────────────────────────────
   COURSES_DB — full dictionary for O(1) lookup & autocomplete
───────────────────────────────────────────────────────── */
export const COURSES_DB: Record<string, Course> = {

  /* ═══ Zoology & Ecology — Compulsory ═══ */
  'Zoo 221': { code: 'Zoo 221', nameEn: 'Invertebrate 1', nameAr: 'لافقاريات 1', credits: 2, prerequisite: 'Zoo 101', type: 'compulsory' },
  'Zoo 223': { code: 'Zoo 223', nameEn: 'Genetics', nameAr: 'وراثة', credits: 3, prerequisite: 'Zoo 101', type: 'compulsory' },
  'Zoo 224': { code: 'Zoo 224', nameEn: 'Chordates', nameAr: 'حبليات', credits: 3, prerequisite: 'Zoo 101', type: 'compulsory' },
  'Zoo 231': { code: 'Zoo 231', nameEn: 'Cell Biology', nameAr: 'بيولوجيا الخلية', credits: 2, prerequisite: 'Zoo 101', type: 'compulsory' },
  'Zoo 241': { code: 'Zoo 241', nameEn: 'Introduction to Ecology', nameAr: 'مقدمة في علم البيئة', credits: 2, prerequisite: 'Zoo 101', type: 'compulsory' },
  'Eco 245': { code: 'Eco 245', nameEn: 'Limnology', nameAr: 'علم المياه العذبة', credits: 3, prerequisite: 'Zoo 101', type: 'compulsory' },
  'Eco 246': { code: 'Eco 246', nameEn: 'Zoogeography', nameAr: 'الجغرافيا الحيوية الحيوانية', credits: 2, prerequisite: 'Zoo 101', type: 'compulsory' },
  'Eco 290': { code: 'Eco 290', nameEn: 'Biodiversity', nameAr: 'التنوع البيولوجي', credits: 2, prerequisite: 'Zoo 101', type: 'compulsory' },
  'Eco 292': { code: 'Eco 292', nameEn: 'Terrestrial and Desert Ecology', nameAr: 'البيئة البرية والصحراوية', credits: 2, prerequisite: 'Zoo 241', type: 'compulsory' },
  'Zoo 298': { code: 'Zoo 298', nameEn: 'Fish Biology', nameAr: 'بيولوجيا الأسماك', credits: 2, prerequisite: null, type: 'compulsory' },
  'Eco 321': { code: 'Eco 321', nameEn: 'GIS and Remote Sensing', nameAr: 'نظم المعلومات الجغرافية والاستشعار عن بعد', credits: 2, prerequisite: 'Zoo 241', type: 'compulsory' },
  'Zoo 343': { code: 'Zoo 343', nameEn: 'Physiology 1', nameAr: 'علم وظائف الأعضاء 1', credits: 3, prerequisite: 'Zoo 101', type: 'compulsory' },
  'Zoo 344': { code: 'Zoo 344', nameEn: 'Embryology and Experimental Embryology', nameAr: 'علم الأجنة والأجنة التجريبي', credits: 3, prerequisite: 'Zoo 343', type: 'compulsory' },
  'Zoo 345': { code: 'Zoo 345', nameEn: 'Immunology', nameAr: 'علم المناعة', credits: 2, prerequisite: 'Zoo 101', type: 'compulsory' },
  'Zoo 348': { code: 'Zoo 348', nameEn: 'Cell and Tissue Culture', nameAr: 'مزارع الخلايا والأنسجة', credits: 3, prerequisite: 'Zoo 231', type: 'compulsory' },
  'Zoo 349': { code: 'Zoo 349', nameEn: 'Microscopic Technique', nameAr: 'التقنيات المجهرية', credits: 2, prerequisite: 'Zoo 101', type: 'compulsory' },
  'Eco 395': { code: 'Eco 395', nameEn: 'Pollution Climate Change', nameAr: 'التلوث والتغيرات المناخية', credits: 2, prerequisite: 'Zoo 241', type: 'compulsory' },
  'Eco 422': { code: 'Eco 422', nameEn: 'National Parks', nameAr: 'المحميات الطبيعية', credits: 2, prerequisite: 'Zoo 241', type: 'compulsory' },
  'Zoo 460': { code: 'Zoo 460', nameEn: 'Histopathology and Histochemistry', nameAr: 'باثولوجيا وكيمياء الأنسجة', credits: 3, prerequisite: 'Zoo 101', type: 'compulsory' },
  'Zoo 463': { code: 'Zoo 463', nameEn: 'Comparative Anatomy (1)', nameAr: 'تشريح مقارن 1', credits: 3, prerequisite: 'Zoo 101', type: 'compulsory' },
  'Zoo 464': { code: 'Zoo 464', nameEn: 'Parasitology', nameAr: 'علم الطفيليات', credits: 2, prerequisite: 'Zoo 221', type: 'compulsory' },
  'Zoo 469': { code: 'Zoo 469', nameEn: 'Molecular Anatomy', nameAr: 'التشريح الجزيئي', credits: 2, prerequisite: 'Zoo 231', type: 'compulsory' },
  'Zoo 470': { code: 'Zoo 470', nameEn: 'Eco-physiology', nameAr: 'وظائف الأعضاء البيئي', credits: 3, prerequisite: 'Zoo 343', type: 'compulsory' },
  'Zoo 484': { code: 'Zoo 484', nameEn: 'Evolution and Co-evolution', nameAr: 'التطور والتطور المشترك', credits: 2, prerequisite: null, type: 'compulsory' },
  'Zoo 487': { code: 'Zoo 487', nameEn: 'Marine Biology', nameAr: 'الأحياء البحرية', credits: 3, prerequisite: 'Zoo 101', type: 'compulsory' },

  /* ═══ Zoology & Ecology — Elective ═══ */
  'Eco 205': { code: 'Eco 205', nameEn: 'Energy and Sustainable Energy', nameAr: 'الطاقة والطاقة المستدامة', credits: 2, prerequisite: 'Zoo 101', type: 'elective' },
  'Zoo 210': { code: 'Zoo 210', nameEn: 'Hematology', nameAr: 'علم أمراض الدم', credits: 2, prerequisite: 'Zoo 102', type: 'elective' },
  'Zoo 229': { code: 'Zoo 229', nameEn: 'Aquaculture', nameAr: 'الاستزراع المائي', credits: 2, prerequisite: 'Zoo 101', type: 'elective' },
  'Zoo 234': { code: 'Zoo 234', nameEn: 'Introduction to Biotechnology', nameAr: 'مقدمة في التكنولوجيا الحيوية', credits: 2, prerequisite: 'Zoo 101', type: 'elective' },
  'Ent 260': { code: 'Ent 260', nameEn: 'Entomology', nameAr: 'علم الحشرات', credits: 2, prerequisite: 'Zoo 101', type: 'elective' },
  'Eco 261': { code: 'Eco 261', nameEn: 'Sustainable Development', nameAr: 'التنمية المستدامة', credits: 2, prerequisite: 'Zoo 101', type: 'elective' },
  'Zoo 351': { code: 'Zoo 351', nameEn: 'Molecular Biology', nameAr: 'البيولوجيا الجزيئية', credits: 2, prerequisite: 'Zoo 101', type: 'elective' },
  'Zoo 354': { code: 'Zoo 354', nameEn: 'Animal Behavior and Evolution', nameAr: 'سلوك الحيوان وتطوره', credits: 2, prerequisite: 'Zoo 101', type: 'elective' },
  'Zoo 356': { code: 'Zoo 356', nameEn: 'Animal Economy', nameAr: 'اقتصاديات الحيوان', credits: 2, prerequisite: 'Zoo 102', type: 'elective' },
  'Eco 382': { code: 'Eco 382', nameEn: 'Eco-city and Green Architecture', nameAr: 'المدينة البيئية والعمارة الخضراء', credits: 2, prerequisite: null, type: 'elective' },
  'Eco 383': { code: 'Eco 383', nameEn: 'Environmental Impact Assessment', nameAr: 'تقييم الأثر البيئي', credits: 2, prerequisite: null, type: 'elective' },
  'Zoo 385': { code: 'Zoo 385', nameEn: 'Comparative Physiology', nameAr: 'علم وظائف الأعضاء المقارن', credits: 2, prerequisite: 'Zoo 224', type: 'elective' },
  'Eco 355': { code: 'Eco 355', nameEn: 'Marine Biotechnology', nameAr: 'التكنولوجيا الحيوية البحرية', credits: 2, prerequisite: null, type: 'elective' },
  'Zoo 477': { code: 'Zoo 477', nameEn: 'Enzymes', nameAr: 'الإنزيمات', credits: 3, prerequisite: 'Zoo 343', type: 'elective' },
  'Eco 485': { code: 'Eco 485', nameEn: 'Molecular Ecology', nameAr: 'البيئة الجزيئية', credits: 2, prerequisite: 'Zoo 343', type: 'elective' },
  'Mic 488': { code: 'Mic 488', nameEn: 'Serums and Vaccines', nameAr: 'الأمصال واللقاحات', credits: 2, prerequisite: 'Zoo 231', type: 'elective' },
  'Zoo 494': { code: 'Zoo 494', nameEn: 'Frozen Zoo', nameAr: 'الحديقة المجمدة', credits: 2, prerequisite: 'Zoo 349', type: 'elective' },
  'Zoo 496': { code: 'Zoo 496', nameEn: 'Adaptive Physiology', nameAr: 'وظائف الأعضاء التكيفي', credits: 2, prerequisite: 'Zoo 343', type: 'elective' },
  'BTC 475': { code: 'BTC 475', nameEn: 'Cancer Biology', nameAr: 'بيولوجيا السرطان', credits: 3, prerequisite: 'Zoo 231', type: 'elective' },

  /* ═══ Biotechnology — Compulsory ═══ */
  'Mic 224': { code: 'Mic 224', nameEn: 'Microbiology & Intro to Biotech', nameAr: 'الميكروبيولوجي ومقدمة التكنولوجيا الحيوية', credits: 3, prerequisite: 'Bot 100', type: 'compulsory' },
  'BTC 226': { code: 'BTC 226', nameEn: 'Biotechnology', nameAr: 'التكنولوجيا الحيوية', credits: 3, prerequisite: 'Zoo 101', type: 'compulsory' },
  'Zoo 227': { code: 'Zoo 227', nameEn: 'Vertebrates', nameAr: 'فقاريات', credits: 3, prerequisite: 'Zoo 101', type: 'compulsory' },
  'BCh 228': { code: 'BCh 228', nameEn: 'Biochemistry', nameAr: 'الكيمياء الحيوية', credits: 2, prerequisite: 'Chm 105', type: 'compulsory' },
  'BTC 233': { code: 'BTC 233', nameEn: 'Environmental Biotechnology', nameAr: 'التكنولوجيا الحيوية البيئية', credits: 3, prerequisite: 'Zoo 101', type: 'compulsory' },
  'BTC 235': { code: 'BTC 235', nameEn: 'Nanotechnology', nameAr: 'تكنولوجيا النانو', credits: 3, prerequisite: null, type: 'compulsory' },
  'Bot 349': { code: 'Bot 349', nameEn: 'Bioremediation', nameAr: 'المعالجة البيولوجية', credits: 3, prerequisite: 'Mic 224', type: 'compulsory' },
  'Bio 355': { code: 'Bio 355', nameEn: 'Biotechnology Management', nameAr: 'إدارة التكنولوجيا الحيوية', credits: 1, prerequisite: null, type: 'compulsory' },
  'BTC 357': { code: 'BTC 357', nameEn: 'Proteomics', nameAr: 'علم البروتينات', credits: 3, prerequisite: 'Zoo 223', type: 'compulsory' },
  'Zoo 461': { code: 'Zoo 461', nameEn: 'Bioinformatics', nameAr: 'المعلوماتية الحيوية', credits: 3, prerequisite: 'Zoo 101', type: 'compulsory' },
  'Zoo 462': { code: 'Zoo 462', nameEn: 'Genomic Analysis', nameAr: 'التحليل الجينومي', credits: 3, prerequisite: 'Zoo 223', type: 'compulsory' },
  'Zoo 467': { code: 'Zoo 467', nameEn: 'Instrumentation Technology', nameAr: 'تكنولوجيا الأجهزة والمعدات', credits: 2, prerequisite: null, type: 'compulsory' },
  'Zoo 468': { code: 'Zoo 468', nameEn: 'Epigenetics', nameAr: 'علم فوق الجينات', credits: 3, prerequisite: 'Zoo 223', type: 'compulsory' },
  'BTC 471': { code: 'BTC 471', nameEn: 'Advanced Genetic & Protein Engineering', nameAr: 'الهندسة الوراثية والبروتينية المتقدمة', credits: 3, prerequisite: 'Zoo 223', type: 'compulsory' },
  'Zoo 485': { code: 'Zoo 485', nameEn: 'Molecular Ecology', nameAr: 'البيئة الجزيئية للبيوتك', credits: 2, prerequisite: 'Zoo 351', type: 'compulsory' },
  'Zoo 497': { code: 'Zoo 497', nameEn: 'Stem Cell Biology', nameAr: 'بيولوجيا الخلايا الجذعية', credits: 3, prerequisite: 'Zoo 231', type: 'compulsory' },

  /* ═══ Biotechnology — Elective ═══ */
  'Zoo 230': { code: 'Zoo 230', nameEn: 'Toxicology and Animal Toxins', nameAr: 'علم السموم والسموم الحيوانية', credits: 3, prerequisite: 'Zoo 102', type: 'elective' },
  'Mat 204': { code: 'Mat 204', nameEn: 'Numerical Analysis (1)', nameAr: 'التحليل العددي 1', credits: 2, prerequisite: 'Mat 101', type: 'elective' },
  'Com 220': { code: 'Com 220', nameEn: 'Data Structures', nameAr: 'تراكيب البيانات', credits: 3, prerequisite: 'Com 102', type: 'elective' },
  'Com 224': { code: 'Com 224', nameEn: 'Operating Systems', nameAr: 'نظم التشغيل', credits: 2, prerequisite: null, type: 'elective' },
  'Zoo 242': { code: 'Zoo 242', nameEn: 'Developmental Biology', nameAr: 'بيولوجيا التطور', credits: 3, prerequisite: 'Zoo 101', type: 'elective' },
  'Com 323': { code: 'Com 323', nameEn: 'Database Management Systems', nameAr: 'نظم إدارة قواعد البيانات', credits: 3, prerequisite: 'Com 102', type: 'elective' },
  'Chm 331': { code: 'Chm 331', nameEn: 'Applied Electrochemistry', nameAr: 'الكيمياء الكهربية التطبيقية', credits: 3, prerequisite: 'Chm 105', type: 'elective' },
  'Zoo 346': { code: 'Zoo 346', nameEn: 'Physiology (2)', nameAr: 'علم وظائف الأعضاء 2', credits: 3, prerequisite: 'Zoo 343', type: 'elective' },
  'Zoo 350': { code: 'Zoo 350', nameEn: 'Neuroendocrinology', nameAr: 'الغدد الصماء العصبية', credits: 2, prerequisite: 'Zoo 343', type: 'elective' },
  'Bch 352': { code: 'Bch 352', nameEn: 'Clinical Biochemistry', nameAr: 'الكيمياء الحيوية الإكلينيكية', credits: 3, prerequisite: 'BCh 228', type: 'elective' },
  'Zoo 352': { code: 'Zoo 352', nameEn: 'Immunotherapy', nameAr: 'العلاج المناعي', credits: 2, prerequisite: 'Zoo 345', type: 'elective' },
  'Zoo 362': { code: 'Zoo 362', nameEn: 'Genomics', nameAr: 'علم الجينوم', credits: 3, prerequisite: 'Zoo 223', type: 'elective' },
  'Eco 366': { code: 'Eco 366', nameEn: 'Pollution and Climate Change', nameAr: 'التلوث والتغير المناخي', credits: 2, prerequisite: 'Zoo 101', type: 'elective' },
  'Zoo 466': { code: 'Zoo 466', nameEn: 'Marine and Fish Biology', nameAr: 'أحياء البحار والأسماك', credits: 3, prerequisite: 'Zoo 102', type: 'elective' },
  'Zoo 472': { code: 'Zoo 472', nameEn: 'Histopathology and Tissue Culture', nameAr: 'باثولوجيا الأنسجة ومزارع الخلايا', credits: 3, prerequisite: 'Zoo 460', type: 'elective' },
  'Zoo 479': { code: 'Zoo 479', nameEn: 'Ontogeny and Phylogeny of Immune System', nameAr: 'نشأة وتطور الجهاز المناعي', credits: 3, prerequisite: 'Zoo 345', type: 'elective' },

  /* ═══ Free Optional (shared pool) ═══ */
  'Com 223': { code: 'Com 223', nameEn: 'Logic Design (1)', nameAr: 'التصميم المنطقي 1', credits: 2, prerequisite: null, type: 'free_optional' },
  'Geo 236': { code: 'Geo 236', nameEn: 'Rock Forming Minerals', nameAr: 'المعادن المكونة للصخور', credits: 2, prerequisite: null, type: 'free_optional' },
  'Chm 240': { code: 'Chm 240', nameEn: 'Organic Chemistry', nameAr: 'الكيمياء العضوية', credits: 2, prerequisite: null, type: 'free_optional' },
  'Ent 258': { code: 'Ent 258', nameEn: 'Medical Entomology', nameAr: 'علم الحشرات الطبي', credits: 2, prerequisite: null, type: 'free_optional' },
  'Bph 280': { code: 'Bph 280', nameEn: 'Basis of Biophysics', nameAr: 'أسس الفيزياء الحيوية', credits: 2, prerequisite: null, type: 'free_optional' },
  'Bot 353': { code: 'Bot 353', nameEn: 'Food Science', nameAr: 'علوم الأغذية', credits: 2, prerequisite: null, type: 'free_optional' },

  /* ═══ Training & Research (Zoology / Biotech) ═══ */
  'Zoo 300': { code: 'Zoo 300', nameEn: 'Applied and Field Training', nameAr: 'التدريب الميداني والتطبيقي', credits: 3, prerequisite: null, type: 'training' },
  'Zoo 442': { code: 'Zoo 442', nameEn: 'Research and Essay (Zoology)', nameAr: 'البحث والمقال (حيوان)', credits: 3, prerequisite: null, type: 'research' },
  'Bot 400': { code: 'Bot 400', nameEn: 'Research and Essay (Biotech)', nameAr: 'البحث والمقال (بيوتك)', credits: 3, prerequisite: null, type: 'research' },

  /* ════════════════════════════════════════════════
     CHEMISTRY PROGRAM
  ════════════════════════════════════════════════ */
  /* — Level 2 Compulsory — */
  'Chm 211': { code: 'Chm 211', nameEn: 'Physical Chemistry 1', nameAr: 'الكيمياء الفيزيائية 1', credits: 3, prerequisite: 'Chm 105', type: 'compulsory' },
  'Chm 212': { code: 'Chm 212', nameEn: 'Inorganic Chemistry 1', nameAr: 'الكيمياء غير العضوية 1', credits: 3, prerequisite: 'Chm 105', type: 'compulsory' },
  'Chm 213': { code: 'Chm 213', nameEn: 'Analytical Chemistry 1', nameAr: 'الكيمياء التحليلية 1', credits: 3, prerequisite: 'Chm 105', type: 'compulsory' },
  'Chm 214': { code: 'Chm 214', nameEn: 'Organic Chemistry 1', nameAr: 'الكيمياء العضوية 1', credits: 3, prerequisite: 'Chm 105', type: 'compulsory' },
  'Chm 215': { code: 'Chm 215', nameEn: 'Mathematics for Chemistry', nameAr: 'الرياضيات للكيميائيين', credits: 2, prerequisite: 'Mat 101', type: 'compulsory' },
  'Chm 216': { code: 'Chm 216', nameEn: 'Physical Chemistry 2', nameAr: 'الكيمياء الفيزيائية 2', credits: 3, prerequisite: 'Chm 211', type: 'compulsory' },
  'Chm 217': { code: 'Chm 217', nameEn: 'Inorganic Chemistry 2', nameAr: 'الكيمياء غير العضوية 2', credits: 3, prerequisite: 'Chm 212', type: 'compulsory' },
  'Chm 218': { code: 'Chm 218', nameEn: 'Analytical Chemistry 2', nameAr: 'الكيمياء التحليلية 2', credits: 3, prerequisite: 'Chm 213', type: 'compulsory' },
  'Chm 219': { code: 'Chm 219', nameEn: 'Organic Chemistry 2', nameAr: 'الكيمياء العضوية 2', credits: 3, prerequisite: 'Chm 214', type: 'compulsory' },
  /* — Level 2 Elective — */
  'Chm 220': { code: 'Chm 220', nameEn: 'Computer Applications in Chemistry', nameAr: 'تطبيقات الحاسب في الكيمياء', credits: 2, prerequisite: null, type: 'elective' },
  'Chm 221': { code: 'Chm 221', nameEn: 'Nuclear and Radiation Chemistry', nameAr: 'الكيمياء النووية والإشعاعية', credits: 2, prerequisite: null, type: 'elective' },
  'Chm 222': { code: 'Chm 222', nameEn: 'Environmental Pollution Chemistry', nameAr: 'كيمياء التلوث البيئي', credits: 2, prerequisite: null, type: 'elective' },
  'Chm 223': { code: 'Chm 223', nameEn: 'Surface and Colloid Chemistry', nameAr: 'كيمياء السطوح والغروانيات', credits: 2, prerequisite: 'Chm 211', type: 'elective' },
  /* — Level 3 Compulsory — */
  'Chm 310': { code: 'Chm 310', nameEn: 'Industrial Chemistry', nameAr: 'الكيمياء الصناعية', credits: 3, prerequisite: 'Chm 211', type: 'compulsory' },
  'Chm 311': { code: 'Chm 311', nameEn: 'Spectroscopy', nameAr: 'الطيفية', credits: 2, prerequisite: 'Chm 211', type: 'compulsory' },
  'Chm 312': { code: 'Chm 312', nameEn: 'Polymer Chemistry', nameAr: 'كيمياء البوليمرات', credits: 3, prerequisite: 'Chm 219', type: 'compulsory' },
  'Chm 313': { code: 'Chm 313', nameEn: 'Organometallic Chemistry', nameAr: 'الكيمياء العضوية المعدنية', credits: 2, prerequisite: 'Chm 217', type: 'compulsory' },
  'Chm 314': { code: 'Chm 314', nameEn: 'Separation Techniques', nameAr: 'تقنيات الفصل', credits: 2, prerequisite: 'Chm 213', type: 'compulsory' },
  'Chm 315': { code: 'Chm 315', nameEn: 'Advanced Organic Chemistry', nameAr: 'الكيمياء العضوية المتقدمة', credits: 3, prerequisite: 'Chm 219', type: 'compulsory' },
  'Chm 316': { code: 'Chm 316', nameEn: 'Electrochemical Analysis', nameAr: 'التحليل الكهروكيميائي', credits: 2, prerequisite: 'Chm 213', type: 'compulsory' },
  /* — Level 3 Elective — */
  'Chm 317': { code: 'Chm 317', nameEn: 'Pharmaceutical Chemistry', nameAr: 'الكيمياء الدوائية', credits: 2, prerequisite: 'Chm 219', type: 'elective' },
  'Chm 318': { code: 'Chm 318', nameEn: 'Coordination Chemistry', nameAr: 'كيمياء مركبات التآزر', credits: 2, prerequisite: 'Chm 217', type: 'elective' },
  'Chm 319': { code: 'Chm 319', nameEn: 'Green Chemistry', nameAr: 'الكيمياء الخضراء', credits: 2, prerequisite: null, type: 'elective' },
  'Chm 320': { code: 'Chm 320', nameEn: 'Applied Spectroscopy', nameAr: 'الطيفية التطبيقية', credits: 2, prerequisite: 'Chm 311', type: 'elective' },
  /* — Level 4 Compulsory — */
  'Chm 410': { code: 'Chm 410', nameEn: 'Computational Chemistry', nameAr: 'الكيمياء الحسابية', credits: 2, prerequisite: null, type: 'compulsory' },
  'Chm 411': { code: 'Chm 411', nameEn: 'Petroleum Chemistry', nameAr: 'كيمياء البترول', credits: 3, prerequisite: 'Chm 310', type: 'compulsory' },
  'Chm 412': { code: 'Chm 412', nameEn: 'Chemical Safety & Industrial Hazards', nameAr: 'السلامة الكيميائية والمخاطر الصناعية', credits: 1, prerequisite: null, type: 'compulsory' },
  'Chm 413': { code: 'Chm 413', nameEn: 'Advanced Analytical Chemistry', nameAr: 'الكيمياء التحليلية المتقدمة', credits: 3, prerequisite: 'Chm 314', type: 'compulsory' },
  /* — Level 4 Elective — */
  'Chm 414': { code: 'Chm 414', nameEn: 'Food Chemistry', nameAr: 'كيمياء الأغذية', credits: 2, prerequisite: null, type: 'elective' },
  'Chm 415': { code: 'Chm 415', nameEn: 'Biochemistry for Chemists', nameAr: 'الكيمياء الحيوية للكيميائيين', credits: 2, prerequisite: null, type: 'elective' },
  'Chm 416': { code: 'Chm 416', nameEn: 'Materials Chemistry', nameAr: 'كيمياء المواد', credits: 2, prerequisite: 'Chm 312', type: 'elective' },
  /* — Training & Research — */
  'Chm 300': { code: 'Chm 300', nameEn: 'Field Training (Chemistry)', nameAr: 'التدريب الميداني (كيمياء)', credits: 3, prerequisite: null, type: 'training' },
  'Chm 420': { code: 'Chm 420', nameEn: 'Research Project (Chemistry)', nameAr: 'مشروع البحث (كيمياء)', credits: 3, prerequisite: null, type: 'research' },

  /* ════════════════════════════════════════════════
     PHYSICS PROGRAM
  ════════════════════════════════════════════════ */
  /* — Level 2 Compulsory — */
  'Phy 211': { code: 'Phy 211', nameEn: 'Classical Mechanics', nameAr: 'الميكانيكا الكلاسيكية', credits: 3, prerequisite: 'Mat 101', type: 'compulsory' },
  'Phy 212': { code: 'Phy 212', nameEn: 'Electromagnetism 1', nameAr: 'الكهرومغناطيسية 1', credits: 3, prerequisite: 'Mat 101', type: 'compulsory' },
  'Phy 213': { code: 'Phy 213', nameEn: 'Thermodynamics', nameAr: 'الديناميكا الحرارية', credits: 3, prerequisite: null, type: 'compulsory' },
  'Phy 214': { code: 'Phy 214', nameEn: 'Mathematics for Physics 1', nameAr: 'الرياضيات للفيزيائيين 1', credits: 2, prerequisite: 'Mat 101', type: 'compulsory' },
  'Phy 215': { code: 'Phy 215', nameEn: 'Electromagnetism 2', nameAr: 'الكهرومغناطيسية 2', credits: 3, prerequisite: 'Phy 212', type: 'compulsory' },
  'Phy 216': { code: 'Phy 216', nameEn: 'Waves and Acoustics', nameAr: 'الموجات والصوتيات', credits: 2, prerequisite: 'Phy 211', type: 'compulsory' },
  'Phy 217': { code: 'Phy 217', nameEn: 'Quantum Mechanics 1', nameAr: 'ميكانيكا الكم 1', credits: 3, prerequisite: 'Phy 211', type: 'compulsory' },
  'Phy 218': { code: 'Phy 218', nameEn: 'Mathematics for Physics 2', nameAr: 'الرياضيات للفيزيائيين 2', credits: 2, prerequisite: 'Phy 214', type: 'compulsory' },
  /* — Level 2 Elective — */
  'Phy 219': { code: 'Phy 219', nameEn: 'Optics', nameAr: 'البصريات', credits: 2, prerequisite: null, type: 'elective' },
  'Phy 220': { code: 'Phy 220', nameEn: 'Electronics 1', nameAr: 'الإلكترونيات 1', credits: 2, prerequisite: null, type: 'elective' },
  'Phy 221': { code: 'Phy 221', nameEn: 'Introduction to Nuclear Physics', nameAr: 'مقدمة في الفيزياء النووية', credits: 2, prerequisite: null, type: 'elective' },
  'Phy 222': { code: 'Phy 222', nameEn: 'Introduction to Solid State Physics', nameAr: 'مقدمة في فيزياء الحالة الصلبة', credits: 2, prerequisite: null, type: 'elective' },
  /* — Level 3 Compulsory — */
  'Phy 310': { code: 'Phy 310', nameEn: 'Statistical Mechanics', nameAr: 'الميكانيكا الإحصائية', credits: 3, prerequisite: 'Phy 213', type: 'compulsory' },
  'Phy 311': { code: 'Phy 311', nameEn: 'Quantum Mechanics 2', nameAr: 'ميكانيكا الكم 2', credits: 3, prerequisite: 'Phy 217', type: 'compulsory' },
  'Phy 312': { code: 'Phy 312', nameEn: 'Electronics 2', nameAr: 'الإلكترونيات 2', credits: 2, prerequisite: 'Phy 220', type: 'compulsory' },
  'Phy 313': { code: 'Phy 313', nameEn: 'Solid State Physics 1', nameAr: 'فيزياء الحالة الصلبة 1', credits: 3, prerequisite: 'Phy 217', type: 'compulsory' },
  'Phy 314': { code: 'Phy 314', nameEn: 'Nuclear Physics', nameAr: 'الفيزياء النووية', credits: 3, prerequisite: 'Phy 217', type: 'compulsory' },
  'Phy 315': { code: 'Phy 315', nameEn: 'Computational Physics', nameAr: 'الفيزياء الحسابية', credits: 2, prerequisite: null, type: 'compulsory' },
  'Phy 316': { code: 'Phy 316', nameEn: 'Advanced Electrodynamics', nameAr: 'الديناميكا الكهربية المتقدمة', credits: 2, prerequisite: 'Phy 215', type: 'compulsory' },
  /* — Level 3 Elective — */
  'Phy 317': { code: 'Phy 317', nameEn: 'Astrophysics', nameAr: 'الفيزياء الفلكية', credits: 2, prerequisite: null, type: 'elective' },
  'Phy 318': { code: 'Phy 318', nameEn: 'Laser Physics', nameAr: 'فيزياء الليزر', credits: 2, prerequisite: 'Phy 219', type: 'elective' },
  'Phy 319': { code: 'Phy 319', nameEn: 'Introduction to Medical Physics', nameAr: 'مقدمة في الفيزياء الطبية', credits: 2, prerequisite: null, type: 'elective' },
  'Phy 320': { code: 'Phy 320', nameEn: 'Semiconductor Physics', nameAr: 'فيزياء أشباه الموصلات', credits: 2, prerequisite: 'Phy 313', type: 'elective' },
  /* — Level 4 Compulsory — */
  'Phy 410': { code: 'Phy 410', nameEn: 'Advanced Quantum Mechanics', nameAr: 'ميكانيكا الكم المتقدمة', credits: 3, prerequisite: 'Phy 311', type: 'compulsory' },
  'Phy 411': { code: 'Phy 411', nameEn: 'Plasma Physics', nameAr: 'فيزياء البلازما', credits: 2, prerequisite: 'Phy 311', type: 'compulsory' },
  'Phy 412': { code: 'Phy 412', nameEn: 'Applied Nuclear Physics', nameAr: 'الفيزياء النووية التطبيقية', credits: 3, prerequisite: 'Phy 314', type: 'compulsory' },
  'Phy 413': { code: 'Phy 413', nameEn: 'Solid State Physics 2', nameAr: 'فيزياء الحالة الصلبة 2', credits: 2, prerequisite: 'Phy 313', type: 'compulsory' },
  /* — Level 4 Elective — */
  'Phy 414': { code: 'Phy 414', nameEn: 'Particle Physics', nameAr: 'فيزياء الجسيمات', credits: 2, prerequisite: 'Phy 311', type: 'elective' },
  'Phy 415': { code: 'Phy 415', nameEn: 'Photonics', nameAr: 'الفوتونيات', credits: 2, prerequisite: 'Phy 318', type: 'elective' },
  'Phy 416': { code: 'Phy 416', nameEn: 'Materials Science', nameAr: 'علم المواد', credits: 2, prerequisite: 'Phy 313', type: 'elective' },
  'Phy 417': { code: 'Phy 417', nameEn: 'Space Physics', nameAr: 'فيزياء الفضاء', credits: 2, prerequisite: null, type: 'elective' },
  /* — Training & Research — */
  'Phy 300': { code: 'Phy 300', nameEn: 'Field Training (Physics)', nameAr: 'التدريب الميداني (فيزياء)', credits: 3, prerequisite: null, type: 'training' },
  'Phy 420': { code: 'Phy 420', nameEn: 'Research Project (Physics)', nameAr: 'مشروع البحث (فيزياء)', credits: 3, prerequisite: null, type: 'research' },

  /* ════════════════════════════════════════════════
     MATHEMATICS PROGRAM
  ════════════════════════════════════════════════ */
  /* — Level 2 Compulsory — */
  'Mat 211': { code: 'Mat 211', nameEn: 'Advanced Calculus 1', nameAr: 'حساب التفاضل والتكامل المتقدم 1', credits: 3, prerequisite: 'Mat 101', type: 'compulsory' },
  'Mat 212': { code: 'Mat 212', nameEn: 'Linear Algebra', nameAr: 'الجبر الخطي', credits: 3, prerequisite: 'Mat 101', type: 'compulsory' },
  'Mat 213': { code: 'Mat 213', nameEn: 'Discrete Mathematics', nameAr: 'الرياضيات المتقطعة', credits: 2, prerequisite: null, type: 'compulsory' },
  'Mat 214': { code: 'Mat 214', nameEn: 'Differential Equations 1', nameAr: 'المعادلات التفاضلية 1', credits: 3, prerequisite: 'Mat 101', type: 'compulsory' },
  'Mat 215': { code: 'Mat 215', nameEn: 'Advanced Calculus 2', nameAr: 'حساب التفاضل والتكامل المتقدم 2', credits: 3, prerequisite: 'Mat 211', type: 'compulsory' },
  'Mat 216': { code: 'Mat 216', nameEn: 'Abstract Algebra', nameAr: 'الجبر المجرد', credits: 3, prerequisite: 'Mat 212', type: 'compulsory' },
  'Mat 217': { code: 'Mat 217', nameEn: 'Probability and Statistics', nameAr: 'الاحتمالات والإحصاء', credits: 2, prerequisite: 'Mat 101', type: 'compulsory' },
  'Mat 218': { code: 'Mat 218', nameEn: 'Differential Equations 2', nameAr: 'المعادلات التفاضلية 2', credits: 2, prerequisite: 'Mat 214', type: 'compulsory' },
  /* — Level 2 Elective — */
  'Mat 219': { code: 'Mat 219', nameEn: 'Mathematical Logic', nameAr: 'المنطق الرياضي', credits: 2, prerequisite: null, type: 'elective' },
  'Mat 220': { code: 'Mat 220', nameEn: 'Number Theory', nameAr: 'نظرية الأعداد', credits: 2, prerequisite: 'Mat 101', type: 'elective' },
  'Mat 221': { code: 'Mat 221', nameEn: 'Combinatorics', nameAr: 'التوافقيات', credits: 2, prerequisite: null, type: 'elective' },
  /* — Level 3 Compulsory — */
  'Mat 310': { code: 'Mat 310', nameEn: 'Real Analysis', nameAr: 'التحليل الحقيقي', credits: 3, prerequisite: 'Mat 211', type: 'compulsory' },
  'Mat 311': { code: 'Mat 311', nameEn: 'Complex Analysis', nameAr: 'التحليل المركب', credits: 3, prerequisite: 'Mat 211', type: 'compulsory' },
  'Mat 312': { code: 'Mat 312', nameEn: 'Partial Differential Equations', nameAr: 'المعادلات التفاضلية الجزئية', credits: 3, prerequisite: 'Mat 218', type: 'compulsory' },
  'Mat 313': { code: 'Mat 313', nameEn: 'Operations Research 1', nameAr: 'بحوث العمليات 1', credits: 2, prerequisite: null, type: 'compulsory' },
  'Mat 314': { code: 'Mat 314', nameEn: 'Functional Analysis', nameAr: 'التحليل الدالي', credits: 3, prerequisite: 'Mat 310', type: 'compulsory' },
  'Mat 315': { code: 'Mat 315', nameEn: 'Mathematical Statistics', nameAr: 'الإحصاء الرياضي', credits: 2, prerequisite: 'Mat 217', type: 'compulsory' },
  'Mat 316': { code: 'Mat 316', nameEn: 'Numerical Analysis 2', nameAr: 'التحليل العددي 2', credits: 2, prerequisite: 'Mat 204', type: 'compulsory' },
  'Mat 317': { code: 'Mat 317', nameEn: 'Operations Research 2', nameAr: 'بحوث العمليات 2', credits: 2, prerequisite: 'Mat 313', type: 'compulsory' },
  /* — Level 3 Elective — */
  'Mat 318': { code: 'Mat 318', nameEn: 'Topology', nameAr: 'الطوبولوجيا', credits: 2, prerequisite: 'Mat 310', type: 'elective' },
  'Mat 319': { code: 'Mat 319', nameEn: 'Graph Theory', nameAr: 'نظرية الرسوم البيانية', credits: 2, prerequisite: 'Mat 213', type: 'elective' },
  'Mat 320': { code: 'Mat 320', nameEn: 'Game Theory', nameAr: 'نظرية الألعاب', credits: 2, prerequisite: null, type: 'elective' },
  'Mat 321': { code: 'Mat 321', nameEn: 'Differential Geometry', nameAr: 'الهندسة التفاضلية', credits: 2, prerequisite: 'Mat 211', type: 'elective' },
  /* — Level 4 Compulsory — */
  'Mat 410': { code: 'Mat 410', nameEn: 'Mathematical Modeling', nameAr: 'النمذجة الرياضية', credits: 3, prerequisite: null, type: 'compulsory' },
  'Mat 411': { code: 'Mat 411', nameEn: 'Advanced Analysis', nameAr: 'التحليل المتقدم', credits: 2, prerequisite: 'Mat 314', type: 'compulsory' },
  'Mat 412': { code: 'Mat 412', nameEn: 'Applied Statistics', nameAr: 'الإحصاء التطبيقي', credits: 2, prerequisite: 'Mat 315', type: 'compulsory' },
  'Mat 413': { code: 'Mat 413', nameEn: 'Advanced Algebra', nameAr: 'الجبر المتقدم', credits: 2, prerequisite: 'Mat 216', type: 'compulsory' },
  /* — Level 4 Elective — */
  'Mat 414': { code: 'Mat 414', nameEn: 'Fluid Dynamics (Mathematics)', nameAr: 'ديناميكا الموائع (رياضي)', credits: 2, prerequisite: 'Mat 312', type: 'elective' },
  'Mat 415': { code: 'Mat 415', nameEn: 'Fourier Analysis', nameAr: 'تحليل فورييه', credits: 2, prerequisite: 'Mat 310', type: 'elective' },
  'Mat 416': { code: 'Mat 416', nameEn: 'Actuarial Mathematics', nameAr: 'الرياضيات الاكتوارية', credits: 2, prerequisite: 'Mat 217', type: 'elective' },
  'Mat 417': { code: 'Mat 417', nameEn: 'Coding Theory', nameAr: 'نظرية الترميز', credits: 2, prerequisite: 'Mat 213', type: 'elective' },
  /* — Training & Research — */
  'Mat 300': { code: 'Mat 300', nameEn: 'Field Training (Mathematics)', nameAr: 'التدريب الميداني (رياضيات)', credits: 3, prerequisite: null, type: 'training' },
  'Mat 420': { code: 'Mat 420', nameEn: 'Research Project (Mathematics)', nameAr: 'مشروع البحث (رياضيات)', credits: 3, prerequisite: null, type: 'research' },

  /* ════════════════════════════════════════════════
     COMPUTER SCIENCE PROGRAM
  ════════════════════════════════════════════════ */
  /* — Level 2 Compulsory — */
  'CS 211':  { code: 'CS 211',  nameEn: 'Programming 1 (C++)', nameAr: 'برمجة 1 (++C)', credits: 3, prerequisite: 'Com 102', type: 'compulsory' },
  'CS 212':  { code: 'CS 212',  nameEn: 'Computer Organization & Architecture', nameAr: 'تنظيم وبنية الحاسب', credits: 3, prerequisite: null, type: 'compulsory' },
  'CS 213':  { code: 'CS 213',  nameEn: 'Discrete Mathematics for CS', nameAr: 'الرياضيات المتقطعة لعلوم الحاسب', credits: 2, prerequisite: null, type: 'compulsory' },
  'CS 214':  { code: 'CS 214',  nameEn: 'Probability & Statistics for CS', nameAr: 'الاحتمالات والإحصاء لعلوم الحاسب', credits: 2, prerequisite: null, type: 'compulsory' },
  'CS 215':  { code: 'CS 215',  nameEn: 'Programming 2 (Java / Python)', nameAr: 'برمجة 2 (جافا / بايثون)', credits: 3, prerequisite: 'CS 211', type: 'compulsory' },
  'CS 216':  { code: 'CS 216',  nameEn: 'Algorithms Analysis & Design', nameAr: 'تحليل وتصميم الخوارزميات', credits: 3, prerequisite: 'Com 220', type: 'compulsory' },
  /* — Level 2 Elective — */
  'CS 217':  { code: 'CS 217',  nameEn: 'Web Design & Development', nameAr: 'تصميم وتطوير مواقع الويب', credits: 2, prerequisite: 'Com 102', type: 'elective' },
  'CS 218':  { code: 'CS 218',  nameEn: 'Introduction to Mobile Computing', nameAr: 'مقدمة في الحوسبة المتنقلة', credits: 2, prerequisite: null, type: 'elective' },
  'CS 219':  { code: 'CS 219',  nameEn: 'Introduction to Computer Networks', nameAr: 'مقدمة في شبكات الحاسب', credits: 2, prerequisite: null, type: 'elective' },
  /* — Level 3 Compulsory — */
  'CS 310':  { code: 'CS 310',  nameEn: 'Software Engineering', nameAr: 'هندسة البرمجيات', credits: 3, prerequisite: 'CS 215', type: 'compulsory' },
  'CS 311':  { code: 'CS 311',  nameEn: 'Computer Networks', nameAr: 'شبكات الحاسب', credits: 3, prerequisite: 'CS 219', type: 'compulsory' },
  'CS 312':  { code: 'CS 312',  nameEn: 'Compiler Design', nameAr: 'تصميم المترجمات', credits: 3, prerequisite: 'CS 215', type: 'compulsory' },
  'CS 313':  { code: 'CS 313',  nameEn: 'Artificial Intelligence', nameAr: 'الذكاء الاصطناعي', credits: 3, prerequisite: 'CS 216', type: 'compulsory' },
  'CS 314':  { code: 'CS 314',  nameEn: 'Information Systems', nameAr: 'نظم المعلومات', credits: 2, prerequisite: 'Com 323', type: 'compulsory' },
  'CS 315':  { code: 'CS 315',  nameEn: 'Software Testing & Quality Assurance', nameAr: 'اختبار البرمجيات وضمان الجودة', credits: 2, prerequisite: 'CS 310', type: 'compulsory' },
  'CS 316':  { code: 'CS 316',  nameEn: 'Human Computer Interaction', nameAr: 'تفاعل الإنسان والحاسب', credits: 2, prerequisite: null, type: 'compulsory' },
  /* — Level 3 Elective — */
  'CS 317':  { code: 'CS 317',  nameEn: 'Computer Graphics', nameAr: 'رسوميات الحاسب', credits: 2, prerequisite: null, type: 'elective' },
  'CS 318':  { code: 'CS 318',  nameEn: 'Cyber Security', nameAr: 'الأمن السيبراني', credits: 2, prerequisite: null, type: 'elective' },
  'CS 319':  { code: 'CS 319',  nameEn: 'Introduction to Machine Learning', nameAr: 'مقدمة في تعلم الآلة', credits: 2, prerequisite: 'CS 215', type: 'elective' },
  'CS 320':  { code: 'CS 320',  nameEn: 'Cloud Computing', nameAr: 'الحوسبة السحابية', credits: 2, prerequisite: null, type: 'elective' },
  /* — Level 4 Compulsory — */
  'CS 410':  { code: 'CS 410',  nameEn: 'Machine Learning', nameAr: 'تعلم الآلة', credits: 3, prerequisite: 'CS 313', type: 'compulsory' },
  'CS 411':  { code: 'CS 411',  nameEn: 'Distributed Systems', nameAr: 'الأنظمة الموزعة', credits: 2, prerequisite: 'CS 311', type: 'compulsory' },
  'CS 412':  { code: 'CS 412',  nameEn: 'Mobile Applications Development', nameAr: 'تطوير تطبيقات المحمول', credits: 2, prerequisite: 'CS 215', type: 'compulsory' },
  'CS 413':  { code: 'CS 413',  nameEn: 'Senior Capstone Project', nameAr: 'مشروع التخرج', credits: 2, prerequisite: null, type: 'compulsory' },
  /* — Level 4 Elective — */
  'CS 414':  { code: 'CS 414',  nameEn: 'Deep Learning', nameAr: 'التعلم العميق', credits: 2, prerequisite: 'CS 410', type: 'elective' },
  'CS 415':  { code: 'CS 415',  nameEn: 'Computer Vision', nameAr: 'الرؤية الحاسوبية', credits: 2, prerequisite: 'CS 410', type: 'elective' },
  'CS 416':  { code: 'CS 416',  nameEn: 'Natural Language Processing', nameAr: 'معالجة اللغات الطبيعية', credits: 2, prerequisite: 'CS 313', type: 'elective' },
  'CS 417':  { code: 'CS 417',  nameEn: 'Blockchain Technology', nameAr: 'تقنية البلوك تشين', credits: 2, prerequisite: null, type: 'elective' },
  /* — Training & Research — */
  'CS 300':  { code: 'CS 300',  nameEn: 'Field Training (Computer Science)', nameAr: 'التدريب الميداني (علوم الحاسب)', credits: 3, prerequisite: null, type: 'training' },
  'CS 420':  { code: 'CS 420',  nameEn: 'Research Project (Computer Science)', nameAr: 'مشروع البحث (علوم الحاسب)', credits: 3, prerequisite: null, type: 'research' },

  /* ════════════════════════════════════════════════
     BOTANY & MICROBIOLOGY PROGRAM
  ════════════════════════════════════════════════ */
  /* — Level 2 Compulsory — */
  'Bot 211': { code: 'Bot 211', nameEn: 'Phycology', nameAr: 'علم الطحالب', credits: 3, prerequisite: 'Bot 100', type: 'compulsory' },
  'Bot 212': { code: 'Bot 212', nameEn: 'Plant Physiology 1', nameAr: 'فسيولوجيا النبات 1', credits: 3, prerequisite: 'Bot 100', type: 'compulsory' },
  'Mic 213': { code: 'Mic 213', nameEn: 'Mycology & Plant Pathology', nameAr: 'علم الفطريات وأمراض النبات', credits: 3, prerequisite: 'Bot 100', type: 'compulsory' },
  'Bot 214': { code: 'Bot 214', nameEn: 'Plant Anatomy', nameAr: 'تشريح النبات', credits: 2, prerequisite: 'Bot 100', type: 'compulsory' },
  'Bot 215': { code: 'Bot 215', nameEn: 'Plant Taxonomy', nameAr: 'تصنيف النبات', credits: 3, prerequisite: 'Bot 100', type: 'compulsory' },
  'Bot 216': { code: 'Bot 216', nameEn: 'Plant Physiology 2', nameAr: 'فسيولوجيا النبات 2', credits: 3, prerequisite: 'Bot 212', type: 'compulsory' },
  'Mic 217': { code: 'Mic 217', nameEn: 'General Microbiology', nameAr: 'الميكروبيولوجيا العامة', credits: 3, prerequisite: 'Bot 100', type: 'compulsory' },
  'Bot 218': { code: 'Bot 218', nameEn: 'Morphology of Flowering Plants', nameAr: 'مورفولوجيا النباتات المزهرة', credits: 2, prerequisite: 'Bot 100', type: 'compulsory' },
  /* — Level 2 Elective — */
  'Bot 219': { code: 'Bot 219', nameEn: 'Medicinal and Aromatic Plants', nameAr: 'النباتات الطبية والعطرية', credits: 2, prerequisite: 'Bot 100', type: 'elective' },
  'Bot 220': { code: 'Bot 220', nameEn: 'Plant Ecology', nameAr: 'البيئة النباتية', credits: 2, prerequisite: 'Bot 100', type: 'elective' },
  'Mic 221': { code: 'Mic 221', nameEn: 'Introduction to Virology', nameAr: 'مقدمة في علم الفيروسات', credits: 2, prerequisite: null, type: 'elective' },
  'Bot 222': { code: 'Bot 222', nameEn: 'Economic Botany', nameAr: 'النبات الاقتصادي', credits: 2, prerequisite: 'Bot 100', type: 'elective' },
  /* — Level 3 Compulsory — */
  'Mic 310': { code: 'Mic 310', nameEn: 'Microbial Physiology', nameAr: 'فسيولوجيا الأحياء الدقيقة', credits: 3, prerequisite: 'Mic 217', type: 'compulsory' },
  'Bot 311': { code: 'Bot 311', nameEn: 'Plant Biochemistry', nameAr: 'الكيمياء الحيوية النباتية', credits: 3, prerequisite: 'Bot 212', type: 'compulsory' },
  'Bot 312': { code: 'Bot 312', nameEn: 'Plant Biotechnology', nameAr: 'التكنولوجيا الحيوية النباتية', credits: 3, prerequisite: 'Bot 100', type: 'compulsory' },
  'Mic 313': { code: 'Mic 313', nameEn: 'Environmental Microbiology', nameAr: 'الميكروبيولوجيا البيئية', credits: 2, prerequisite: 'Mic 217', type: 'compulsory' },
  'Mic 314': { code: 'Mic 314', nameEn: 'Applied Microbiology', nameAr: 'الميكروبيولوجيا التطبيقية', credits: 3, prerequisite: 'Mic 217', type: 'compulsory' },
  'Mic 315': { code: 'Mic 315', nameEn: 'Food Microbiology', nameAr: 'ميكروبيولوجيا الأغذية', credits: 2, prerequisite: 'Mic 217', type: 'compulsory' },
  'Mic 316': { code: 'Mic 316', nameEn: 'Soil Microbiology', nameAr: 'ميكروبيولوجيا التربة', credits: 2, prerequisite: 'Mic 217', type: 'compulsory' },
  'Bot 317': { code: 'Bot 317', nameEn: 'Plant Molecular Biology', nameAr: 'البيولوجيا الجزيئية النباتية', credits: 3, prerequisite: 'Bot 100', type: 'compulsory' },
  /* — Level 3 Elective — */
  'Mic 318': { code: 'Mic 318', nameEn: 'Industrial Microbiology', nameAr: 'الميكروبيولوجيا الصناعية', credits: 2, prerequisite: 'Mic 217', type: 'elective' },
  'Mic 319': { code: 'Mic 319', nameEn: 'Mycotoxins', nameAr: 'السموم الفطرية', credits: 2, prerequisite: 'Mic 213', type: 'elective' },
  'Bot 320': { code: 'Bot 320', nameEn: 'Biocontrol of Plant Diseases', nameAr: 'المكافحة البيولوجية لأمراض النبات', credits: 2, prerequisite: 'Mic 213', type: 'elective' },
  'Bot 321': { code: 'Bot 321', nameEn: 'Ethnobotany', nameAr: 'الإثنوبوتانيكا', credits: 2, prerequisite: 'Bot 100', type: 'elective' },
  /* — Level 4 Compulsory — */
  'Bot 410': { code: 'Bot 410', nameEn: 'Advanced Plant Physiology', nameAr: 'فسيولوجيا النبات المتقدمة', credits: 3, prerequisite: 'Bot 216', type: 'compulsory' },
  'Mic 411': { code: 'Mic 411', nameEn: 'Virology', nameAr: 'علم الفيروسات', credits: 3, prerequisite: 'Mic 217', type: 'compulsory' },
  'Bot 412': { code: 'Bot 412', nameEn: 'Parasitic Plants', nameAr: 'النباتات الطفيلية', credits: 2, prerequisite: 'Bot 215', type: 'compulsory' },
  'Mic 413': { code: 'Mic 413', nameEn: 'Fermentation Technology', nameAr: 'تكنولوجيا التخمر', credits: 3, prerequisite: 'Mic 217', type: 'compulsory' },
  /* — Level 4 Elective — */
  'Bot 414': { code: 'Bot 414', nameEn: 'Algal Biotechnology', nameAr: 'التكنولوجيا الحيوية للطحالب', credits: 2, prerequisite: 'Bot 211', type: 'elective' },
  'Mic 415': { code: 'Mic 415', nameEn: 'Clinical Microbiology', nameAr: 'الميكروبيولوجيا الإكلينيكية', credits: 2, prerequisite: 'Mic 217', type: 'elective' },
  'Bot 416': { code: 'Bot 416', nameEn: 'Desert Plants', nameAr: 'نباتات المناطق الجافة', credits: 2, prerequisite: 'Bot 220', type: 'elective' },
  /* — Training & Research — */
  'Bot 300': { code: 'Bot 300', nameEn: 'Field Training (Botany & Microbiology)', nameAr: 'التدريب الميداني (نبات وميكروبيولوجي)', credits: 3, prerequisite: null, type: 'training' },
  'Bot 441': { code: 'Bot 441', nameEn: 'Research Project (Botany & Microbiology)', nameAr: 'مشروع البحث (نبات وميكروبيولوجي)', credits: 3, prerequisite: null, type: 'research' },

  /* ════════════════════════════════════════════════
     GEOLOGY PROGRAM
  ════════════════════════════════════════════════ */
  /* — Level 2 Compulsory — */
  'Geo 211': { code: 'Geo 211', nameEn: 'Crystallography & Mineralogy 1', nameAr: 'علم البلورات والمعادن 1', credits: 3, prerequisite: null, type: 'compulsory' },
  'Geo 212': { code: 'Geo 212', nameEn: 'Physical Geology', nameAr: 'الجيولوجيا الطبيعية', credits: 3, prerequisite: null, type: 'compulsory' },
  'Geo 213': { code: 'Geo 213', nameEn: 'Introduction to Paleontology', nameAr: 'مقدمة في الحفريات', credits: 2, prerequisite: null, type: 'compulsory' },
  'Geo 214': { code: 'Geo 214', nameEn: 'General Stratigraphy', nameAr: 'علم الطبقات العام', credits: 2, prerequisite: null, type: 'compulsory' },
  'Geo 215': { code: 'Geo 215', nameEn: 'Mineralogy 2', nameAr: 'علم المعادن 2', credits: 3, prerequisite: 'Geo 211', type: 'compulsory' },
  'Geo 216': { code: 'Geo 216', nameEn: 'Petrology 1', nameAr: 'الصخور 1', credits: 3, prerequisite: 'Geo 211', type: 'compulsory' },
  'Geo 217': { code: 'Geo 217', nameEn: 'Structural Geology', nameAr: 'الجيولوجيا التركيبية', credits: 3, prerequisite: 'Geo 212', type: 'compulsory' },
  'Geo 218': { code: 'Geo 218', nameEn: 'Paleontology 2', nameAr: 'الحفريات 2', credits: 2, prerequisite: 'Geo 213', type: 'compulsory' },
  /* — Level 2 Elective — */
  'Geo 219': { code: 'Geo 219', nameEn: 'Maps & Field Methods', nameAr: 'الخرائط والأساليب الميدانية', credits: 2, prerequisite: null, type: 'elective' },
  'Geo 220': { code: 'Geo 220', nameEn: 'Historical Geology', nameAr: 'الجيولوجيا التاريخية', credits: 2, prerequisite: 'Geo 213', type: 'elective' },
  'Geo 221': { code: 'Geo 221', nameEn: 'Introduction to Geophysics', nameAr: 'مقدمة في الجيوفيزياء', credits: 2, prerequisite: null, type: 'elective' },
  'Geo 222': { code: 'Geo 222', nameEn: 'Petrology 2 (Metamorphic & Sedimentary)', nameAr: 'الصخور 2 (متحولة ورسوبية)', credits: 2, prerequisite: 'Geo 216', type: 'elective' },
  /* — Level 3 Compulsory — */
  'Geo 310': { code: 'Geo 310', nameEn: 'Economic Geology', nameAr: 'الجيولوجيا الاقتصادية', credits: 3, prerequisite: 'Geo 216', type: 'compulsory' },
  'Geo 311': { code: 'Geo 311', nameEn: 'Geochemistry', nameAr: 'الجيوكيمياء', credits: 3, prerequisite: null, type: 'compulsory' },
  'Geo 312': { code: 'Geo 312', nameEn: 'Hydrogeology', nameAr: 'الجيولوجيا المائية', credits: 3, prerequisite: 'Geo 212', type: 'compulsory' },
  'Geo 313': { code: 'Geo 313', nameEn: 'Applied Geophysics', nameAr: 'الجيوفيزياء التطبيقية', credits: 3, prerequisite: null, type: 'compulsory' },
  'Geo 314': { code: 'Geo 314', nameEn: 'Remote Sensing & GIS in Geology', nameAr: 'الاستشعار عن بعد ونظم المعلومات الجغرافية', credits: 2, prerequisite: null, type: 'compulsory' },
  'Geo 315': { code: 'Geo 315', nameEn: 'Environmental Geology', nameAr: 'الجيولوجيا البيئية', credits: 2, prerequisite: null, type: 'compulsory' },
  'Geo 316': { code: 'Geo 316', nameEn: 'Marine Geology', nameAr: 'الجيولوجيا البحرية', credits: 2, prerequisite: 'Geo 212', type: 'compulsory' },
  /* — Level 3 Elective — */
  'Geo 317': { code: 'Geo 317', nameEn: 'Petroleum Geology', nameAr: 'جيولوجيا البترول', credits: 2, prerequisite: 'Geo 216', type: 'elective' },
  'Geo 318': { code: 'Geo 318', nameEn: 'Engineering Geology', nameAr: 'الجيولوجيا الهندسية', credits: 2, prerequisite: null, type: 'elective' },
  'Geo 319': { code: 'Geo 319', nameEn: 'Applied Geochemistry', nameAr: 'الجيوكيمياء التطبيقية', credits: 2, prerequisite: 'Geo 311', type: 'elective' },
  'Geo 320': { code: 'Geo 320', nameEn: 'Mining Geology', nameAr: 'جيولوجيا التعدين', credits: 2, prerequisite: 'Geo 310', type: 'elective' },
  /* — Level 4 Compulsory — */
  'Geo 410': { code: 'Geo 410', nameEn: 'Ore Microscopy', nameAr: 'مجهر الخامات المعدنية', credits: 3, prerequisite: 'Geo 310', type: 'compulsory' },
  'Geo 411': { code: 'Geo 411', nameEn: 'Advanced Structural Geology', nameAr: 'الجيولوجيا التركيبية المتقدمة', credits: 2, prerequisite: 'Geo 217', type: 'compulsory' },
  'Geo 412': { code: 'Geo 412', nameEn: 'Quaternary Geology & Geomorphology', nameAr: 'الجيولوجيا الرباعية والجيومورفولوجيا', credits: 2, prerequisite: 'Geo 218', type: 'compulsory' },
  'Geo 413': { code: 'Geo 413', nameEn: 'Geostatistics', nameAr: 'الإحصاء الجيولوجي', credits: 2, prerequisite: null, type: 'compulsory' },
  /* — Level 4 Elective — */
  'Geo 414': { code: 'Geo 414', nameEn: 'Volcanology', nameAr: 'علم البراكين', credits: 2, prerequisite: 'Geo 216', type: 'elective' },
  'Geo 415': { code: 'Geo 415', nameEn: 'Isotope Geology', nameAr: 'الجيولوجيا الإيزوتوبية', credits: 2, prerequisite: 'Geo 311', type: 'elective' },
  'Geo 416': { code: 'Geo 416', nameEn: 'Cosmochemistry', nameAr: 'الكيمياء الكونية', credits: 2, prerequisite: null, type: 'elective' },
  'Geo 417': { code: 'Geo 417', nameEn: 'Geotechnical Engineering', nameAr: 'الهندسة الجيوتقنية', credits: 2, prerequisite: null, type: 'elective' },
  /* — Training & Research — */
  'Geo 300': { code: 'Geo 300', nameEn: 'Field Training (Geology)', nameAr: 'التدريب الميداني (جيولوجيا)', credits: 3, prerequisite: null, type: 'training' },
  'Geo 440': { code: 'Geo 440', nameEn: 'Research Project (Geology)', nameAr: 'مشروع البحث (جيولوجيا)', credits: 3, prerequisite: null, type: 'research' },

  /* ════════════════════════════════════════════════
     BIOPHYSICS PROGRAM
  ════════════════════════════════════════════════ */
  /* — Level 2 Compulsory — */
  'Bph 211': { code: 'Bph 211', nameEn: 'Classical Biophysics', nameAr: 'الفيزياء الحيوية الكلاسيكية', credits: 3, prerequisite: null, type: 'compulsory' },
  'Bph 212': { code: 'Bph 212', nameEn: 'Radiation Biophysics', nameAr: 'الفيزياء الحيوية الإشعاعية', credits: 3, prerequisite: null, type: 'compulsory' },
  'Bph 213': { code: 'Bph 213', nameEn: 'Biophysical Chemistry', nameAr: 'الكيمياء الفيزيائية الحيوية', credits: 2, prerequisite: 'Chm 105', type: 'compulsory' },
  'Bph 214': { code: 'Bph 214', nameEn: 'Mathematics for Biophysics', nameAr: 'الرياضيات للفيزياء الحيوية', credits: 2, prerequisite: 'Mat 101', type: 'compulsory' },
  'Bph 215': { code: 'Bph 215', nameEn: 'Membrane Biophysics', nameAr: 'فيزياء الأغشية الحيوية', credits: 3, prerequisite: 'Bph 211', type: 'compulsory' },
  'Bph 216': { code: 'Bph 216', nameEn: 'Medical Instrumentation', nameAr: 'الأجهزة الطبية', credits: 2, prerequisite: null, type: 'compulsory' },
  'Bph 217': { code: 'Bph 217', nameEn: 'Bioelectricity & Biomagnetism', nameAr: 'الكهرباء والمغناطيسية الحيوية', credits: 2, prerequisite: 'Bph 211', type: 'compulsory' },
  'Bph 218': { code: 'Bph 218', nameEn: 'Thermodynamics of Living Systems', nameAr: 'الديناميكا الحرارية للأنظمة الحية', credits: 2, prerequisite: null, type: 'compulsory' },
  /* — Level 2 Elective — */
  'Bph 219': { code: 'Bph 219', nameEn: 'Medical Physics 1', nameAr: 'الفيزياء الطبية 1', credits: 2, prerequisite: null, type: 'elective' },
  'Bph 220': { code: 'Bph 220', nameEn: 'Introduction to Electronics for Biophysics', nameAr: 'مقدمة في الإلكترونيات للفيزياء الحيوية', credits: 2, prerequisite: null, type: 'elective' },
  'Bph 221': { code: 'Bph 221', nameEn: 'Radiobiology', nameAr: 'الأحياء الإشعاعية', credits: 2, prerequisite: 'Bph 212', type: 'elective' },
  'Bph 222': { code: 'Bph 222', nameEn: 'Spectroscopy in Biology', nameAr: 'الطيفية في الأحياء', credits: 2, prerequisite: null, type: 'elective' },
  /* — Level 3 Compulsory — */
  'Bph 310': { code: 'Bph 310', nameEn: 'Laser & Optics Applications in Medicine', nameAr: 'تطبيقات الليزر والبصريات في الطب', credits: 3, prerequisite: null, type: 'compulsory' },
  'Bph 311': { code: 'Bph 311', nameEn: 'Molecular Biophysics', nameAr: 'الفيزياء الحيوية الجزيئية', credits: 3, prerequisite: 'Bph 211', type: 'compulsory' },
  'Bph 312': { code: 'Bph 312', nameEn: 'Biomedical Imaging', nameAr: 'التصوير الطبي الحيوي', credits: 3, prerequisite: null, type: 'compulsory' },
  'Bph 313': { code: 'Bph 313', nameEn: 'Signal Processing for Biophysics', nameAr: 'معالجة الإشارات للفيزياء الحيوية', credits: 2, prerequisite: null, type: 'compulsory' },
  'Bph 314': { code: 'Bph 314', nameEn: 'Radiation Physics & Dosimetry', nameAr: 'فيزياء الإشعاع والجرعومترية', credits: 3, prerequisite: 'Bph 212', type: 'compulsory' },
  'Bph 315': { code: 'Bph 315', nameEn: 'Medical Imaging & Diagnosis', nameAr: 'التصوير الطبي والتشخيص', credits: 2, prerequisite: 'Bph 312', type: 'compulsory' },
  'Bph 316': { code: 'Bph 316', nameEn: 'Biomechanics', nameAr: 'الميكانيكا الحيوية', credits: 2, prerequisite: null, type: 'compulsory' },
  /* — Level 3 Elective — */
  'Bph 317': { code: 'Bph 317', nameEn: 'Biophysics of Muscle & Nerve', nameAr: 'الفيزياء الحيوية للعضلة والعصب', credits: 2, prerequisite: 'Bph 211', type: 'elective' },
  'Bph 318': { code: 'Bph 318', nameEn: 'Environmental Biophysics', nameAr: 'الفيزياء الحيوية البيئية', credits: 2, prerequisite: null, type: 'elective' },
  'Bph 319': { code: 'Bph 319', nameEn: 'Photobiology', nameAr: 'الفوتوبيولوجيا', credits: 2, prerequisite: null, type: 'elective' },
  'Bph 320': { code: 'Bph 320', nameEn: 'Computational Biophysics', nameAr: 'الفيزياء الحيوية الحسابية', credits: 2, prerequisite: null, type: 'elective' },
  /* — Level 4 Compulsory — */
  'Bph 410': { code: 'Bph 410', nameEn: 'Advanced Medical Physics', nameAr: 'الفيزياء الطبية المتقدمة', credits: 3, prerequisite: 'Bph 312', type: 'compulsory' },
  'Bph 411': { code: 'Bph 411', nameEn: 'Ultrasound Physics & Applications', nameAr: 'فيزياء الموجات فوق الصوتية وتطبيقاتها', credits: 2, prerequisite: 'Bph 312', type: 'compulsory' },
  'Bph 412': { code: 'Bph 412', nameEn: 'Nuclear Medicine Physics', nameAr: 'فيزياء الطب النووي', credits: 3, prerequisite: 'Bph 314', type: 'compulsory' },
  'Bph 413': { code: 'Bph 413', nameEn: 'Health Physics & Radiation Protection', nameAr: 'فيزياء الصحة والحماية من الإشعاع', credits: 2, prerequisite: 'Bph 314', type: 'compulsory' },
  /* — Level 4 Elective — */
  'Bph 414': { code: 'Bph 414', nameEn: 'Radiation Therapy Physics', nameAr: 'فيزياء العلاج الإشعاعي', credits: 2, prerequisite: 'Bph 314', type: 'elective' },
  'Bph 415': { code: 'Bph 415', nameEn: 'MRI Physics', nameAr: 'فيزياء التصوير بالرنين المغناطيسي', credits: 2, prerequisite: 'Bph 312', type: 'elective' },
  'Bph 416': { code: 'Bph 416', nameEn: 'Biophysics of Vision', nameAr: 'الفيزياء الحيوية للإبصار', credits: 2, prerequisite: null, type: 'elective' },
  'Bph 417': { code: 'Bph 417', nameEn: 'Nanobiophysics', nameAr: 'الفيزياء الحيوية النانوية', credits: 2, prerequisite: null, type: 'elective' },
  /* — Training & Research — */
  'Bph 300': { code: 'Bph 300', nameEn: 'Field Training (Biophysics)', nameAr: 'التدريب الميداني (فيزياء حيوية)', credits: 3, prerequisite: null, type: 'training' },
  'Bph 441': { code: 'Bph 441', nameEn: 'Research Project (Biophysics)', nameAr: 'مشروع البحث (فيزياء حيوية)', credits: 3, prerequisite: null, type: 'research' },
};

/* ─────────────────────────────────────────────────────────
   FACULTY_DATA — full relational tree
───────────────────────────────────────────────────────── */
export const FACULTY_DATA: Faculty = {
  id: 'science_benha',
  nameAr: 'كلية العلوم - جامعة بنها',
  nameEn: 'Faculty of Science - Benha University',
  departments: [
    /* ════ BIOTECHNOLOGY ════ */
    {
      id: 'biotech',
      nameAr: 'برنامج التكنولوجيا الحيوية',
      nameEn: 'Biotechnology Program',
      levels: [
        {
          levelId: 2,
          levelNameAr: 'المستوى الثاني',
          semesters: [
            {
              semesterId: 1,
              semesterNameAr: 'الفصل الدراسي الأول',
              compulsoryCourseIds: ['Zoo 223', 'Zoo 227', 'Zoo 231', 'BTC 233', 'BTC 235'],
              electiveCourseIds: ['Zoo 230', 'Eco 245'],
              freeOptionalCourseIds: ['Com 223', 'Geo 236'],
            },
            {
              semesterId: 2,
              semesterNameAr: 'الفصل الدراسي الثاني',
              compulsoryCourseIds: ['Mic 224', 'BTC 226', 'BCh 228'],
              electiveCourseIds: ['Zoo 242', 'Mat 204', 'Com 220', 'Com 224'],
              freeOptionalCourseIds: ['Ent 258', 'Bph 280'],
            },
          ],
        },
        {
          levelId: 3,
          levelNameAr: 'المستوى الثالث',
          semesters: [
            {
              semesterId: 1,
              semesterNameAr: 'الفصل الدراسي الأول',
              compulsoryCourseIds: ['Bot 349', 'Zoo 351', 'BTC 357'],
              electiveCourseIds: ['Com 323', 'Zoo 343', 'Chm 331'],
              freeOptionalCourseIds: ['Chm 240', 'Bot 353'],
            },
            {
              semesterId: 2,
              semesterNameAr: 'الفصل الدراسي الثاني',
              compulsoryCourseIds: ['Zoo 345', 'Bio 355', 'Eco 355', 'Zoo 348'],
              electiveCourseIds: ['Zoo 346', 'Zoo 350', 'Bch 352', 'Zoo 352', 'Zoo 362', 'Eco 366'],
              freeOptionalCourseIds: [],
              hasTraining: true,
            },
          ],
        },
        {
          levelId: 4,
          levelNameAr: 'المستوى الرابع',
          semesters: [
            {
              semesterId: 1,
              semesterNameAr: 'الفصل الدراسي الأول',
              compulsoryCourseIds: ['Zoo 461', 'Zoo 467', 'BTC 471', 'Zoo 497'],
              electiveCourseIds: ['Zoo 460', 'Zoo 470', 'Zoo 479'],
              freeOptionalCourseIds: [],
            },
            {
              semesterId: 2,
              semesterNameAr: 'الفصل الدراسي الثاني',
              compulsoryCourseIds: ['Zoo 462', 'Zoo 468', 'BTC 475', 'Zoo 485'],
              electiveCourseIds: ['Zoo 466', 'Zoo 472'],
              freeOptionalCourseIds: [],
              hasResearch: true,
            },
          ],
        },
      ],
    },

    /* ════ ZOOLOGY & ECOLOGY ════ */
    {
      id: 'zoology_ecology',
      nameAr: 'برنامج علم الحيوان والبيئة',
      nameEn: 'Zoology and Ecology Program',
      levels: [
        {
          levelId: 2,
          levelNameAr: 'المستوى الثاني',
          semesters: [
            {
              semesterId: 1,
              semesterNameAr: 'الفصل الدراسي الأول',
              compulsoryCourseIds: ['Zoo 221', 'Zoo 223', 'Zoo 231', 'Zoo 241', 'Eco 245'],
              electiveCourseIds: ['Eco 205', 'Zoo 229', 'Eco 261'],
              freeOptionalCourseIds: ['Com 223', 'Geo 236'],
            },
            {
              semesterId: 2,
              semesterNameAr: 'الفصل الدراسي الثاني',
              compulsoryCourseIds: ['Zoo 224', 'Eco 246', 'Eco 290', 'Eco 292', 'Zoo 298'],
              electiveCourseIds: ['Zoo 210', 'Zoo 234', 'Ent 260'],
              freeOptionalCourseIds: ['Ent 258', 'Bph 280'],
            },
          ],
        },
        {
          levelId: 3,
          levelNameAr: 'المستوى الثالث',
          semesters: [
            {
              semesterId: 1,
              semesterNameAr: 'الفصل الدراسي الأول',
              compulsoryCourseIds: ['Eco 321', 'Zoo 343', 'Zoo 345', 'Zoo 349', 'Eco 395'],
              electiveCourseIds: ['Zoo 351', 'Eco 383', 'Zoo 385'],
              freeOptionalCourseIds: [],
            },
            {
              semesterId: 2,
              semesterNameAr: 'الفصل الدراسي الثاني',
              compulsoryCourseIds: ['Zoo 344', 'Zoo 348'],
              electiveCourseIds: ['Zoo 354', 'Eco 355', 'Zoo 356', 'Eco 382'],
              freeOptionalCourseIds: ['Chm 240', 'Bot 353'],
              hasTraining: true,
            },
          ],
        },
        {
          levelId: 4,
          levelNameAr: 'المستوى الرابع',
          semesters: [
            {
              semesterId: 1,
              semesterNameAr: 'الفصل الدراسي الأول',
              compulsoryCourseIds: ['Zoo 460', 'Zoo 463', 'Zoo 469', 'Zoo 487'],
              electiveCourseIds: ['Zoo 477', 'BTC 475', 'Eco 485'],
              freeOptionalCourseIds: [],
            },
            {
              semesterId: 2,
              semesterNameAr: 'الفصل الدراسي الثاني',
              compulsoryCourseIds: ['Eco 422', 'Zoo 464', 'Zoo 470', 'Zoo 484'],
              electiveCourseIds: ['Mic 488', 'Zoo 494', 'Zoo 496'],
              freeOptionalCourseIds: [],
              hasResearch: true,
            },
          ],
        },
      ],
    },

    /* ════ CHEMISTRY ════ */
    {
      id: 'chemistry',
      nameAr: 'برنامج الكيمياء',
      nameEn: 'Chemistry Program',
      levels: [
        {
          levelId: 2,
          levelNameAr: 'المستوى الثاني',
          semesters: [
            {
              semesterId: 1,
              semesterNameAr: 'الفصل الدراسي الأول',
              compulsoryCourseIds: ['Chm 211', 'Chm 212', 'Chm 213', 'Chm 214', 'Chm 215'],
              electiveCourseIds: ['Chm 220', 'Chm 221'],
              freeOptionalCourseIds: ['Com 223', 'Geo 236'],
            },
            {
              semesterId: 2,
              semesterNameAr: 'الفصل الدراسي الثاني',
              compulsoryCourseIds: ['Chm 216', 'Chm 217', 'Chm 218', 'Chm 219'],
              electiveCourseIds: ['Chm 222', 'Chm 223'],
              freeOptionalCourseIds: ['Ent 258', 'Bph 280'],
            },
          ],
        },
        {
          levelId: 3,
          levelNameAr: 'المستوى الثالث',
          semesters: [
            {
              semesterId: 1,
              semesterNameAr: 'الفصل الدراسي الأول',
              compulsoryCourseIds: ['Chm 310', 'Chm 311', 'Chm 312', 'Chm 313'],
              electiveCourseIds: ['Chm 317', 'Chm 318'],
              freeOptionalCourseIds: ['Bot 353', 'Ent 258'],
            },
            {
              semesterId: 2,
              semesterNameAr: 'الفصل الدراسي الثاني',
              compulsoryCourseIds: ['Chm 314', 'Chm 315', 'Chm 316'],
              electiveCourseIds: ['Chm 319', 'Chm 320'],
              freeOptionalCourseIds: ['Chm 240', 'Bph 280'],
              hasTraining: true,
            },
          ],
        },
        {
          levelId: 4,
          levelNameAr: 'المستوى الرابع',
          semesters: [
            {
              semesterId: 1,
              semesterNameAr: 'الفصل الدراسي الأول',
              compulsoryCourseIds: ['Chm 410', 'Chm 411', 'Chm 412', 'Chm 413'],
              electiveCourseIds: ['Chm 414', 'Chm 415'],
              freeOptionalCourseIds: [],
            },
            {
              semesterId: 2,
              semesterNameAr: 'الفصل الدراسي الثاني',
              compulsoryCourseIds: ['Chm 416'],
              electiveCourseIds: ['Chm 331', 'Chm 319'],
              freeOptionalCourseIds: [],
              hasResearch: true,
            },
          ],
        },
      ],
    },

    /* ════ PHYSICS ════ */
    {
      id: 'physics',
      nameAr: 'برنامج الفيزياء',
      nameEn: 'Physics Program',
      levels: [
        {
          levelId: 2,
          levelNameAr: 'المستوى الثاني',
          semesters: [
            {
              semesterId: 1,
              semesterNameAr: 'الفصل الدراسي الأول',
              compulsoryCourseIds: ['Phy 211', 'Phy 212', 'Phy 213', 'Phy 214'],
              electiveCourseIds: ['Phy 219', 'Phy 220'],
              freeOptionalCourseIds: ['Com 223', 'Chm 240'],
            },
            {
              semesterId: 2,
              semesterNameAr: 'الفصل الدراسي الثاني',
              compulsoryCourseIds: ['Phy 215', 'Phy 216', 'Phy 217', 'Phy 218'],
              electiveCourseIds: ['Phy 221', 'Phy 222'],
              freeOptionalCourseIds: ['Ent 258', 'Bph 280'],
            },
          ],
        },
        {
          levelId: 3,
          levelNameAr: 'المستوى الثالث',
          semesters: [
            {
              semesterId: 1,
              semesterNameAr: 'الفصل الدراسي الأول',
              compulsoryCourseIds: ['Phy 310', 'Phy 311', 'Phy 312', 'Phy 313'],
              electiveCourseIds: ['Phy 317', 'Phy 318'],
              freeOptionalCourseIds: ['Bot 353', 'Geo 236'],
            },
            {
              semesterId: 2,
              semesterNameAr: 'الفصل الدراسي الثاني',
              compulsoryCourseIds: ['Phy 314', 'Phy 315', 'Phy 316'],
              electiveCourseIds: ['Phy 319', 'Phy 320'],
              freeOptionalCourseIds: ['Chm 240', 'Bph 280'],
              hasTraining: true,
            },
          ],
        },
        {
          levelId: 4,
          levelNameAr: 'المستوى الرابع',
          semesters: [
            {
              semesterId: 1,
              semesterNameAr: 'الفصل الدراسي الأول',
              compulsoryCourseIds: ['Phy 410', 'Phy 411', 'Phy 412', 'Phy 413'],
              electiveCourseIds: ['Phy 414', 'Phy 415'],
              freeOptionalCourseIds: [],
            },
            {
              semesterId: 2,
              semesterNameAr: 'الفصل الدراسي الثاني',
              compulsoryCourseIds: ['Phy 416', 'Phy 417'],
              electiveCourseIds: ['Bph 280'],
              freeOptionalCourseIds: [],
              hasResearch: true,
            },
          ],
        },
      ],
    },

    /* ════ MATHEMATICS ════ */
    {
      id: 'mathematics',
      nameAr: 'برنامج الرياضيات',
      nameEn: 'Mathematics Program',
      levels: [
        {
          levelId: 2,
          levelNameAr: 'المستوى الثاني',
          semesters: [
            {
              semesterId: 1,
              semesterNameAr: 'الفصل الدراسي الأول',
              compulsoryCourseIds: ['Mat 211', 'Mat 212', 'Mat 213', 'Mat 214'],
              electiveCourseIds: ['Mat 219', 'Mat 220'],
              freeOptionalCourseIds: ['Com 223', 'Geo 236'],
            },
            {
              semesterId: 2,
              semesterNameAr: 'الفصل الدراسي الثاني',
              compulsoryCourseIds: ['Mat 215', 'Mat 216', 'Mat 217', 'Mat 218'],
              electiveCourseIds: ['Mat 221', 'Mat 204'],
              freeOptionalCourseIds: ['Ent 258', 'Bph 280'],
            },
          ],
        },
        {
          levelId: 3,
          levelNameAr: 'المستوى الثالث',
          semesters: [
            {
              semesterId: 1,
              semesterNameAr: 'الفصل الدراسي الأول',
              compulsoryCourseIds: ['Mat 310', 'Mat 311', 'Mat 312', 'Mat 313'],
              electiveCourseIds: ['Mat 318', 'Mat 319'],
              freeOptionalCourseIds: ['Bot 353', 'Chm 240'],
            },
            {
              semesterId: 2,
              semesterNameAr: 'الفصل الدراسي الثاني',
              compulsoryCourseIds: ['Mat 314', 'Mat 315', 'Mat 316', 'Mat 317'],
              electiveCourseIds: ['Mat 320', 'Mat 321'],
              freeOptionalCourseIds: ['Com 223', 'Bph 280'],
              hasTraining: true,
            },
          ],
        },
        {
          levelId: 4,
          levelNameAr: 'المستوى الرابع',
          semesters: [
            {
              semesterId: 1,
              semesterNameAr: 'الفصل الدراسي الأول',
              compulsoryCourseIds: ['Mat 410', 'Mat 411', 'Mat 412', 'Mat 413'],
              electiveCourseIds: ['Mat 414', 'Mat 415'],
              freeOptionalCourseIds: [],
            },
            {
              semesterId: 2,
              semesterNameAr: 'الفصل الدراسي الثاني',
              compulsoryCourseIds: ['Mat 416', 'Mat 417'],
              electiveCourseIds: ['Mat 319', 'Mat 321'],
              freeOptionalCourseIds: [],
              hasResearch: true,
            },
          ],
        },
      ],
    },

    /* ════ COMPUTER SCIENCE ════ */
    {
      id: 'computer_science',
      nameAr: 'برنامج علوم الحاسب',
      nameEn: 'Computer Science Program',
      levels: [
        {
          levelId: 2,
          levelNameAr: 'المستوى الثاني',
          semesters: [
            {
              semesterId: 1,
              semesterNameAr: 'الفصل الدراسي الأول',
              compulsoryCourseIds: ['CS 211', 'CS 212', 'CS 213', 'CS 214', 'Com 220'],
              electiveCourseIds: ['CS 217', 'Com 223'],
              freeOptionalCourseIds: ['Geo 236', 'Chm 240'],
            },
            {
              semesterId: 2,
              semesterNameAr: 'الفصل الدراسي الثاني',
              compulsoryCourseIds: ['CS 215', 'CS 216', 'Com 224'],
              electiveCourseIds: ['CS 218', 'CS 219'],
              freeOptionalCourseIds: ['Ent 258', 'Bph 280'],
            },
          ],
        },
        {
          levelId: 3,
          levelNameAr: 'المستوى الثالث',
          semesters: [
            {
              semesterId: 1,
              semesterNameAr: 'الفصل الدراسي الأول',
              compulsoryCourseIds: ['CS 310', 'CS 311', 'CS 312', 'Com 323'],
              electiveCourseIds: ['CS 317', 'CS 318'],
              freeOptionalCourseIds: ['Bot 353', 'Geo 236'],
            },
            {
              semesterId: 2,
              semesterNameAr: 'الفصل الدراسي الثاني',
              compulsoryCourseIds: ['CS 313', 'CS 314', 'CS 315', 'CS 316'],
              electiveCourseIds: ['CS 319', 'CS 320'],
              freeOptionalCourseIds: [],
              hasTraining: true,
            },
          ],
        },
        {
          levelId: 4,
          levelNameAr: 'المستوى الرابع',
          semesters: [
            {
              semesterId: 1,
              semesterNameAr: 'الفصل الدراسي الأول',
              compulsoryCourseIds: ['CS 410', 'CS 411', 'CS 412', 'CS 413'],
              electiveCourseIds: ['CS 414', 'CS 415'],
              freeOptionalCourseIds: [],
            },
            {
              semesterId: 2,
              semesterNameAr: 'الفصل الدراسي الثاني',
              compulsoryCourseIds: ['CS 416', 'CS 417'],
              electiveCourseIds: ['CS 319', 'CS 320'],
              freeOptionalCourseIds: [],
              hasResearch: true,
            },
          ],
        },
      ],
    },

    /* ════ BOTANY & MICROBIOLOGY ════ */
    {
      id: 'botany_micro',
      nameAr: 'برنامج النبات والميكروبيولوجي',
      nameEn: 'Botany and Microbiology Program',
      levels: [
        {
          levelId: 2,
          levelNameAr: 'المستوى الثاني',
          semesters: [
            {
              semesterId: 1,
              semesterNameAr: 'الفصل الدراسي الأول',
              compulsoryCourseIds: ['Bot 211', 'Bot 212', 'Mic 213', 'Bot 214', 'Zoo 223'],
              electiveCourseIds: ['Bot 219', 'Bot 220'],
              freeOptionalCourseIds: ['Com 223', 'Geo 236'],
            },
            {
              semesterId: 2,
              semesterNameAr: 'الفصل الدراسي الثاني',
              compulsoryCourseIds: ['Bot 215', 'Bot 216', 'Mic 217', 'Bot 218'],
              electiveCourseIds: ['Mic 221', 'Bot 222'],
              freeOptionalCourseIds: ['Ent 258', 'Bph 280'],
            },
          ],
        },
        {
          levelId: 3,
          levelNameAr: 'المستوى الثالث',
          semesters: [
            {
              semesterId: 1,
              semesterNameAr: 'الفصل الدراسي الأول',
              compulsoryCourseIds: ['Mic 310', 'Bot 311', 'Bot 312', 'Mic 313'],
              electiveCourseIds: ['Mic 318', 'Bot 321'],
              freeOptionalCourseIds: ['Chm 240', 'Bot 353'],
            },
            {
              semesterId: 2,
              semesterNameAr: 'الفصل الدراسي الثاني',
              compulsoryCourseIds: ['Mic 314', 'Mic 315', 'Mic 316', 'Bot 317'],
              electiveCourseIds: ['Mic 319', 'Bot 320'],
              freeOptionalCourseIds: [],
              hasTraining: true,
            },
          ],
        },
        {
          levelId: 4,
          levelNameAr: 'المستوى الرابع',
          semesters: [
            {
              semesterId: 1,
              semesterNameAr: 'الفصل الدراسي الأول',
              compulsoryCourseIds: ['Bot 410', 'Mic 411', 'Bot 412', 'Mic 413'],
              electiveCourseIds: ['Bot 414', 'Mic 415'],
              freeOptionalCourseIds: [],
            },
            {
              semesterId: 2,
              semesterNameAr: 'الفصل الدراسي الثاني',
              compulsoryCourseIds: ['Bot 349', 'Bot 416'],
              electiveCourseIds: ['Mic 488', 'Bot 353'],
              freeOptionalCourseIds: [],
              hasResearch: true,
            },
          ],
        },
      ],
    },

    /* ════ GEOLOGY ════ */
    {
      id: 'geology',
      nameAr: 'برنامج الجيولوجيا',
      nameEn: 'Geology Program',
      levels: [
        {
          levelId: 2,
          levelNameAr: 'المستوى الثاني',
          semesters: [
            {
              semesterId: 1,
              semesterNameAr: 'الفصل الدراسي الأول',
              compulsoryCourseIds: ['Geo 211', 'Geo 212', 'Geo 213', 'Geo 214'],
              electiveCourseIds: ['Geo 219', 'Geo 220'],
              freeOptionalCourseIds: ['Com 223', 'Chm 240'],
            },
            {
              semesterId: 2,
              semesterNameAr: 'الفصل الدراسي الثاني',
              compulsoryCourseIds: ['Geo 215', 'Geo 216', 'Geo 217', 'Geo 218'],
              electiveCourseIds: ['Geo 221', 'Geo 222'],
              freeOptionalCourseIds: ['Ent 258', 'Bph 280'],
            },
          ],
        },
        {
          levelId: 3,
          levelNameAr: 'المستوى الثالث',
          semesters: [
            {
              semesterId: 1,
              semesterNameAr: 'الفصل الدراسي الأول',
              compulsoryCourseIds: ['Geo 310', 'Geo 311', 'Geo 312', 'Geo 313'],
              electiveCourseIds: ['Geo 317', 'Geo 318'],
              freeOptionalCourseIds: ['Bot 353', 'Geo 236'],
            },
            {
              semesterId: 2,
              semesterNameAr: 'الفصل الدراسي الثاني',
              compulsoryCourseIds: ['Geo 314', 'Geo 315', 'Geo 316'],
              electiveCourseIds: ['Geo 319', 'Geo 320'],
              freeOptionalCourseIds: ['Chm 240', 'Bph 280'],
              hasTraining: true,
            },
          ],
        },
        {
          levelId: 4,
          levelNameAr: 'المستوى الرابع',
          semesters: [
            {
              semesterId: 1,
              semesterNameAr: 'الفصل الدراسي الأول',
              compulsoryCourseIds: ['Geo 410', 'Geo 411', 'Geo 412', 'Geo 413'],
              electiveCourseIds: ['Geo 414', 'Geo 415'],
              freeOptionalCourseIds: [],
            },
            {
              semesterId: 2,
              semesterNameAr: 'الفصل الدراسي الثاني',
              compulsoryCourseIds: ['Geo 416', 'Geo 417'],
              electiveCourseIds: ['Geo 319', 'Geo 320'],
              freeOptionalCourseIds: [],
              hasResearch: true,
            },
          ],
        },
      ],
    },

    /* ════ BIOPHYSICS ════ */
    {
      id: 'biophysics',
      nameAr: 'برنامج الفيزياء الحيوية',
      nameEn: 'Biophysics Program',
      levels: [
        {
          levelId: 2,
          levelNameAr: 'المستوى الثاني',
          semesters: [
            {
              semesterId: 1,
              semesterNameAr: 'الفصل الدراسي الأول',
              compulsoryCourseIds: ['Bph 211', 'Bph 212', 'Bph 213', 'Bph 214'],
              electiveCourseIds: ['Bph 219', 'Bph 220'],
              freeOptionalCourseIds: ['Com 223', 'Geo 236'],
            },
            {
              semesterId: 2,
              semesterNameAr: 'الفصل الدراسي الثاني',
              compulsoryCourseIds: ['Bph 215', 'Bph 216', 'Bph 217', 'Bph 218'],
              electiveCourseIds: ['Bph 221', 'Bph 222'],
              freeOptionalCourseIds: ['Ent 258', 'Chm 240'],
            },
          ],
        },
        {
          levelId: 3,
          levelNameAr: 'المستوى الثالث',
          semesters: [
            {
              semesterId: 1,
              semesterNameAr: 'الفصل الدراسي الأول',
              compulsoryCourseIds: ['Bph 310', 'Bph 311', 'Bph 312', 'Bph 313'],
              electiveCourseIds: ['Bph 317', 'Bph 318'],
              freeOptionalCourseIds: ['Bot 353', 'Geo 236'],
            },
            {
              semesterId: 2,
              semesterNameAr: 'الفصل الدراسي الثاني',
              compulsoryCourseIds: ['Bph 314', 'Bph 315', 'Bph 316'],
              electiveCourseIds: ['Bph 319', 'Bph 320'],
              freeOptionalCourseIds: ['Chm 240', 'Bph 280'],
              hasTraining: true,
            },
          ],
        },
        {
          levelId: 4,
          levelNameAr: 'المستوى الرابع',
          semesters: [
            {
              semesterId: 1,
              semesterNameAr: 'الفصل الدراسي الأول',
              compulsoryCourseIds: ['Bph 410', 'Bph 411', 'Bph 412', 'Bph 413'],
              electiveCourseIds: ['Bph 414', 'Bph 415'],
              freeOptionalCourseIds: [],
            },
            {
              semesterId: 2,
              semesterNameAr: 'الفصل الدراسي الثاني',
              compulsoryCourseIds: ['Bph 416', 'Bph 417'],
              electiveCourseIds: ['Bph 221', 'Bph 222'],
              freeOptionalCourseIds: [],
              hasResearch: true,
            },
          ],
        },
      ],
    },
  ],
};

/* ─────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────── */
export function getDepartmentById(deptId: string): Department | undefined {
  return FACULTY_DATA.departments.find((d) => d.id === deptId);
}

export function getLevelData(deptId: string, levelId: number): LevelData | undefined {
  return getDepartmentById(deptId)?.levels.find((l) => l.levelId === levelId);
}

export function getSemesterData(deptId: string, levelId: number, semesterId: 1 | 2): SemesterData | undefined {
  return getLevelData(deptId, levelId)?.semesters.find((s) => s.semesterId === semesterId);
}

export function resolveCourse(courseId: string): Course | undefined {
  return COURSES_DB[courseId];
}

export function resolveMany(ids: string[]): Course[] {
  return ids.map((id) => COURSES_DB[id]).filter(Boolean) as Course[];
}
