export interface Course {
  code: string;
  nameEn: string;
  nameAr: string;
  credits: number;
  prerequisite: string | null;
  type: 'compulsory' | 'elective' | 'free_optional' | 'training' | 'research';
}

export interface SemesterData {
  semesterId: number; // 1 = الأول, 2 = الثاني
  semesterNameAr: string;
  compulsoryCourseIds: string[];
  electiveCourseIds: string[];
  freeOptionalCourseIds: string[];
  hasTraining?: boolean;
  hasResearch?: boolean;
}

export interface LevelData {
  levelId: number; // 2, 3, 4
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

// 1. قاموس شامل لجميع المواد لسهولة البحث الفوري والـ Autocomplete والتحقق من المتطلبات
export const COURSES_DB: Record<string, Course> = {
  // === برنامج علم الحيوان والبيئة ===
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
  'Eco 321': { code: 'Eco 321', nameEn: '(G I S) and Remote Sensing', nameAr: 'نظم المعلومات الجغرافية والاستشعار عن بعد', credits: 2, prerequisite: 'Zoo 241', type: 'compulsory' },
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

  // === اختياري علم حيوان وبيئة ===
  'Eco 205': { code: 'Eco 205', nameEn: 'Energy and Sustainable Energy', nameAr: 'الطاقة والطاقة المستدامة', credits: 2, prerequisite: 'Zoo 101', type: 'elective' },
  'Zoo 210': { code: 'Zoo 210', nameEn: 'Hematology', nameAr: 'علم أمراض الدم', credits: 2, prerequisite: 'Zoo 102', type: 'elective' },
  'Zoo 229': { code: 'Zoo 229', nameEn: 'Aquaculture', nameAr: 'الاستزراع المائي', credits: 2, prerequisite: 'Zoo 101', type: 'elective' },
  'Zoo 234': { code: 'Zoo 234', nameEn: 'Introduction of Biotechnology', nameAr: 'مقدمة في التكنولوجيا الحيوية', credits: 2, prerequisite: 'Zoo 101', type: 'elective' },
  'Ent 260': { code: 'Ent 260', nameEn: 'Entomology', nameAr: 'علم الحشرات', credits: 2, prerequisite: 'Zoo 101', type: 'elective' },
  'Eco 261': { code: 'Eco 261', nameEn: 'Sustainable Development', nameAr: 'التنمية المستدامة', credits: 2, prerequisite: 'Zoo 101', type: 'elective' },
  'Zoo 351': { code: 'Zoo 351', nameEn: 'Molecular Biology', nameAr: 'البيولوجيا الجزيئية', credits: 2, prerequisite: 'Zoo 101', type: 'elective' },
  'Zoo 354': { code: 'Zoo 354', nameEn: 'Animal Behavior and Evolution', nameAr: 'سلوك الحيوان وتطوره', credits: 2, prerequisite: 'Zoo 101', type: 'elective' },
  'Zoo 356': { code: 'Zoo 356', nameEn: 'Animal Economy', nameAr: 'اقتصاديات الحيوان', credits: 2, prerequisite: 'Zoo 102', type: 'elective' },
  'Eco 382': { code: 'Eco 382', nameEn: 'Eco-city and Green Architecture', nameAr: 'المدينة البيئية والعمارة الخضراء', credits: 2, prerequisite: null, type: 'elective' },
  'Eco 383': { code: 'Eco 383', nameEn: 'Environmental Impact Assessment (EIA)', nameAr: 'تقييم الأثر البيئي', credits: 2, prerequisite: null, type: 'elective' },
  'Zoo 385': { code: 'Zoo 385', nameEn: 'Comparative Physiology', nameAr: 'علم وظائف الأعضاء المقارن', credits: 2, prerequisite: 'Zoo 224', type: 'elective' },
  'Zoo 477': { code: 'Zoo 477', nameEn: 'Enzymes', nameAr: 'الإنزيمات', credits: 3, prerequisite: 'Zoo 343', type: 'elective' },
  'Eco 485': { code: 'Eco 485', nameEn: 'Molecular Ecology', nameAr: 'البيئة الجزيئية', credits: 2, prerequisite: 'Zoo 343', type: 'elective' },
  'Mic 488': { code: 'Mic 488', nameEn: 'Serums and Vaccines', nameAr: 'الأمصال واللقاحات', credits: 2, prerequisite: 'Zoo 231', type: 'elective' },
  'Zoo 494': { code: 'Zoo 494', nameEn: 'Frozen Zoo', nameAr: 'الحديقة المجمدة', credits: 2, prerequisite: 'Zoo 349', type: 'elective' },
  'Zoo 496': { code: 'Zoo 496', nameEn: 'Adaptive Physiology', nameAr: 'وظائف الأعضاء التكيفي', credits: 2, prerequisite: 'Zoo 343', type: 'elective' },

  // === برنامج التكنولوجيا الحيوية (Biotechnology) ===
  'Mic 224': { code: 'Mic 224', nameEn: 'Microbiology & Intro to Biotech', nameAr: 'الميكروبيولوجي ومقدمة التكنولوجيا الحيوية', credits: 3, prerequisite: 'Bot 100', type: 'compulsory' },
  'BTC 226': { code: 'BTC 226', nameEn: 'Biotechnology', nameAr: 'التكنولوجيا الحيوية', credits: 3, prerequisite: 'Zoo 101', type: 'compulsory' },
  'Zoo 227': { code: 'Zoo 227', nameEn: 'Vertebrates', nameAr: 'فقاريات', credits: 3, prerequisite: 'Zoo 101', type: 'compulsory' },
  'BCh 228': { code: 'BCh 228', nameEn: 'Biochemistry', nameAr: 'الكيمياء الحيوية', credits: 2, prerequisite: 'Chm 105', type: 'compulsory' },
  'BTC 233': { code: 'BTC 233', nameEn: 'Environmental Biotechnology', nameAr: 'التكنولوجيا الحيوية البيئية', credits: 3, prerequisite: 'Zoo 101', type: 'compulsory' },
  'BTC 235': { code: 'BTC 235', nameEn: 'Nanotechnology', nameAr: 'تكنولوجيا النانو', credits: 3, prerequisite: null, type: 'compulsory' },
  'Bot 349': { code: 'Bot 349', nameEn: 'Bioremediation', nameAr: 'المعالجة البيولوجية', credits: 3, prerequisite: 'Mic 224', type: 'compulsory' },
  'Bio 355': { code: 'Bio 355', nameEn: 'Biotechnology Management', nameAr: 'إدارة التكنولوجيا الحيوية', credits: 1, prerequisite: null, type: 'compulsory' },
  'Eco 355': { code: 'Eco 355', nameEn: 'Marine Biotechnology', nameAr: 'التكنولوجيا الحيوية البحرية', credits: 2, prerequisite: null, type: 'compulsory' },
  'BTC 357': { code: 'BTC 357', nameEn: 'Proteomics', nameAr: 'علم البروتينات', credits: 3, prerequisite: 'Zoo 223', type: 'compulsory' },
  'Zoo 461': { code: 'Zoo 461', nameEn: 'Bioinformatics', nameAr: 'المعلوماتية الحيوية', credits: 3, prerequisite: 'Zoo 101', type: 'compulsory' },
  'Zoo 462': { code: 'Zoo 462', nameEn: 'Genomic Analysis', nameAr: 'التحليل الجينومي', credits: 3, prerequisite: 'Zoo 223', type: 'compulsory' },
  'Zoo 467': { code: 'Zoo 467', nameEn: 'Instrumentation Technology', nameAr: 'تكنولوجيا الأجهزة والمعدات', credits: 2, prerequisite: null, type: 'compulsory' },
  'Zoo 468': { code: 'Zoo 468', nameEn: 'Epigenetics', nameAr: 'علم فوق الجينات', credits: 3, prerequisite: 'Zoo 223', type: 'compulsory' },
  'BTC 471': { code: 'BTC 471', nameEn: 'Advanced Genetic & Protein Engineering', nameAr: 'الهندسة الوراثية والبروتينية المتقدمة', credits: 3, prerequisite: 'Zoo 223', type: 'compulsory' },
  'BTC 475': { code: 'BTC 475', nameEn: 'Cancer Biology', nameAr: 'بيولوجيا السرطان', credits: 3, prerequisite: 'Zoo 231', type: 'compulsory' },
  'Zoo 485': { code: 'Zoo 485', nameEn: 'Molecular Ecology', nameAr: 'البيئة الجزيئية للبيوتك', credits: 2, prerequisite: 'Zoo 351', type: 'compulsory' },
  'Zoo 497': { code: 'Zoo 497', nameEn: 'Stem Cell Biology', nameAr: 'بيولوجيا الخلايا الجذعية', credits: 3, prerequisite: 'Zoo 231', type: 'compulsory' },

  // === اختياري التكنولوجيا الحيوية ===
  'Zoo 230': { code: 'Zoo 230', nameEn: 'Toxicology and Animal Toxins', nameAr: 'علم السموم والسموم الحيوانية', credits: 3, prerequisite: 'Zoo 102', type: 'elective' },
  'Mat 204': { code: 'Mat 204', nameEn: 'Numerical Analysis (1)', nameAr: 'التحليل العددي 1', credits: 2, prerequisite: 'Mat 101', type: 'elective' },
  'Com 220': { code: 'Com 220', nameEn: 'Data Structure', nameAr: 'تراكيب البيانات', credits: 3, prerequisite: 'Com 102', type: 'elective' },
  'Com 224': { code: 'Com 224', nameEn: 'Operating Systems', nameAr: 'نظم التشغيل', credits: 2, prerequisite: null, type: 'elective' },
  'Zoo 242': { code: 'Zoo 242', nameEn: 'Developmental Biology', nameAr: 'بيولوجيا التطور', credits: 3, prerequisite: 'Zoo 101', type: 'elective' },
  'Com 323': { code: 'Com 323', nameEn: 'Database Management Systems', nameAr: 'نظم إدارة قواعد البيانات', credits: 3, prerequisite: 'Com 102', type: 'elective' },
  'Chm 331': { code: 'Chm 331', nameEn: 'Applied Electrochemistry', nameAr: 'الكيمياء الكهربية التطبيقية', credits: 3, prerequisite: 'Chm 105', type: 'elective' },
  'Zoo 346': { code: 'Zoo 346', nameEn: 'Physiology (2)', nameAr: 'علم وظائف الأعضاء 2', credits: 3, prerequisite: 'Zoo 343', type: 'elective' },
  'Zoo 350': { code: 'Zoo 350', nameEn: 'Neuroendocrinology', nameAr: 'الغدد الصماء العصبية', credits: 2, prerequisite: 'Zoo 343', type: 'elective' },
  'Bch 352': { code: 'Bch 352', nameEn: 'Clinical Biochemistry', nameAr: 'الكيمياء الحيوية الإكلينيكية', credits: 3, prerequisite: 'Bch 228', type: 'elective' },
  'Zoo 352': { code: 'Zoo 352', nameEn: 'Immunotherapy', nameAr: 'العلاج المناعي', credits: 2, prerequisite: 'Zoo 345', type: 'elective' },
  'Zoo 362': { code: 'Zoo 362', nameEn: 'Genomics', nameAr: 'علم الجينوم', credits: 3, prerequisite: 'Zoo 223', type: 'elective' },
  'Eco 366': { code: 'Eco 366', nameEn: 'Pollution and Climate Change', nameAr: 'التلوث والتغير المناخي', credits: 2, prerequisite: 'Zoo 101', type: 'elective' },
  'Zoo 466': { code: 'Zoo 466', nameEn: 'Marine and Fish Biology', nameAr: 'أحياء البحار والأسماك', credits: 3, prerequisite: 'Zoo 102', type: 'elective' },
  'Zoo 472': { code: 'Zoo 472', nameEn: 'Histopathology and Tissue Culture', nameAr: 'باثولوجيا الأنسجة ومزارع الخلايا', credits: 3, prerequisite: 'Zoo 465', type: 'elective' },
  'Zoo 479': { code: 'Zoo 479', nameEn: 'Ontogeny and Phylogeny of Immune System', nameAr: 'نشأة وتطور الجهاز المناعي', credits: 3, prerequisite: 'Zoo 345', type: 'elective' },

  // === مقررات الاختيار الحر (المشتركة لكل الكلية) ===
  'Com 223': { code: 'Com 223', nameEn: 'Logic Design (1)', nameAr: 'التصميم المنطقي 1', credits: 2, prerequisite: null, type: 'free_optional' },
  'Geo 236': { code: 'Geo 236', nameEn: 'Rock Forming Minerals', nameAr: 'المعادن المكونة للصخور', credits: 2, prerequisite: null, type: 'free_optional' },
  'Chm 240': { code: 'Chm 240', nameEn: 'Organic Chemistry', nameAr: 'الكيمياء العضوية', credits: 2, prerequisite: null, type: 'free_optional' },
  'Ent 258': { code: 'Ent 258', nameEn: 'Medical Entomology', nameAr: 'علم الحشرات الطبي', credits: 2, prerequisite: null, type: 'free_optional' },
  'Bph 280': { code: 'Bph 280', nameEn: 'Basis of Biophysics', nameAr: 'أسس الفيزياء الحيوية', credits: 2, prerequisite: null, type: 'free_optional' },
  'Bot 353': { code: 'Bot 353', nameEn: 'Food Science', nameAr: 'علوم الأغذية', credits: 2, prerequisite: null, type: 'free_optional' },

  // === التدريب والبحث ===
  'Zoo 300': { code: 'Zoo 300', nameEn: 'Applied and Field Training', nameAr: 'التدريب الميداني والتطبيقي', credits: 3, prerequisite: null, type: 'training' },
  'Zoo 442': { code: 'Zoo 442', nameEn: 'Research and Essay', nameAr: 'البحث والمقال (حيوان)', credits: 3, prerequisite: null, type: 'research' },
  'Bot 400': { code: 'Bot 400', nameEn: 'Research and Essay (Biotech)', nameAr: 'البحث والمقال (بيوتك)', credits: 3, prerequisite: null, type: 'research' }
};

// 2. الهيكل الشجري الشامل للكلية والأقسام والمستويات والترمات المتاحة
export const FACULTY_DATA: Faculty = {
  id: 'science_benha',
  nameAr: 'كلية العلوم - جامعة بنها',
  nameEn: 'Faculty of Science - Benha University',
  departments: [
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
              freeOptionalCourseIds: ['Com 223', 'Geo 236']
            },
            {
              semesterId: 2,
              semesterNameAr: 'الفصل الدراسي الثاني',
              compulsoryCourseIds: ['Mic 224', 'BTC 226', 'BCh 228'],
              electiveCourseIds: ['Zoo 242', 'Mat 204', 'Com 220', 'Com 224'],
              freeOptionalCourseIds: ['Ent 258', 'Bph 280']
            }
          ]
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
              freeOptionalCourseIds: ['Chm 240', 'Bot 353']
            },
            {
              semesterId: 2,
              semesterNameAr: 'الفصل الدراسي الثاني',
              compulsoryCourseIds: ['Zoo 345', 'Bio 355', 'Eco 355', 'Zoo 348'],
              electiveCourseIds: ['Zoo 346', 'Zoo 350', 'Bch 352', 'Zoo 352', 'Zoo 362', 'Eco 366'],
              freeOptionalCourseIds: [],
              hasTraining: true
            }
          ]
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
              freeOptionalCourseIds: []
            },
            {
              semesterId: 2,
              semesterNameAr: 'الفصل الدراسي الثاني',
              compulsoryCourseIds: ['Zoo 462', 'Zoo 468', 'BTC 475', 'Zoo 485'],
              electiveCourseIds: ['Zoo 466', 'Zoo 472'],
              freeOptionalCourseIds: [],
              hasResearch: true
            }
          ]
        }
      ]
    },
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
              freeOptionalCourseIds: ['Com 223', 'Geo 236']
            },
            {
              semesterId: 2,
              semesterNameAr: 'الفصل الدراسي الثاني',
              compulsoryCourseIds: ['Zoo 224', 'Eco 246', 'Eco 290', 'Eco 292', 'Zoo 298'],
              electiveCourseIds: ['Zoo 210', 'Zoo 234', 'Ent 260'],
              freeOptionalCourseIds: ['Ent 258', 'Bph 280']
            }
          ]
        },
        {
          levelId: 3,
          levelNameAr: 'المستوى الثالث',
          semesters: [
            {
              semesterId: 1,
              semesterNameAr: 'الفصل الدراسي الأول',
              compulsoryCourseIds: ['Eco 321', 'Zoo 343', 'Zoo 345', 'Zoo 349', 'Eco 395'],
              electiveCourseIds: ['Zoo 345', 'Zoo 351', 'Eco 383', 'Zoo 385'],
              freeOptionalCourseIds: []
            },
            {
              semesterId: 2,
              semesterNameAr: 'الفصل الدراسي الثاني',
              compulsoryCourseIds: ['Zoo 344', 'Zoo 348'],
              electiveCourseIds: ['Zoo 354', 'Eco 355', 'Zoo 356', 'Eco 382'],
              freeOptionalCourseIds: ['Chm 240', 'Bot 353'],
              hasTraining: true
            }
          ]
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
              freeOptionalCourseIds: []
            },
            {
              semesterId: 2,
              semesterNameAr: 'الفصل الدراسي الثاني',
              compulsoryCourseIds: ['Eco 422', 'Zoo 464', 'Zoo 470', 'Zoo 484'],
              electiveCourseIds: ['Mic 488', 'Zoo 494', 'Zoo 496'],
              freeOptionalCourseIds: [],
              hasResearch: true
            }
          ]
        }
      ]
    }
  ]
};