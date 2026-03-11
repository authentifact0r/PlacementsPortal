/**
 * ATS CV Builder — Overleaf-style Layout
 *
 * Mirrors Overleaf's UX:
 *   Left panel:  "Code Editor" (raw text) or "Visual Editor" (form) toggle
 *   Right panel:  Live A4 paper preview (always visible)
 *   Toolbar:      Recompile, Download, Print, Zoom, Page count
 *
 * Click any text on the preview to edit it inline.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, Download, Eye, Edit3, Trash2, Plus,
  ChevronDown, ChevronUp, Mail, Phone, MapPin, Linkedin,
  Globe, GraduationCap, Briefcase, Award, Code, Loader2,
  CheckCircle, AlertCircle, AlertTriangle, RefreshCw, Printer,
  ZoomIn, ZoomOut, Pencil, Terminal, Type, Zap, Target,
  TrendingUp, PlusCircle, Sparkles, X, Lock, Crown, Star,
  Layout,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

/* ═══════════════════════════════════════════════════════════════════════════
   DATA HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */

const emptyCVData = () => ({
  personal: { fullName: '', title: '', email: '', phone: '', location: '', linkedin: '', website: '' },
  summary: '',
  experience: [],
  education: [],
  skills: [],
  certifications: [],
});

/* ═══════════════════════════════════════════════════════════════════════════
   PREMIUM CV TEMPLATES — anonymised samples derived from real ATS-optimised CVs
   ═══════════════════════════════════════════════════════════════════════════ */
// Users authorised for premium features during testing
const PREMIUM_TEST_EMAILS = ['grace@example.com']; // Add test emails here
const isPremiumUser = (user, profile) => {
  if (!user) return false;
  const email = user.email?.toLowerCase() || '';
  // Check test whitelist, subscription status, or displayName for "grace"
  if (PREMIUM_TEST_EMAILS.includes(email)) return true;
  if (profile?.subscription?.plan === 'pro' || profile?.subscription?.plan === 'premium') return true;
  // Temporary: allow anyone signed in as "grace" during testing
  const name = (user.displayName || profile?.profile?.fullName || '').toLowerCase();
  if (name.includes('grace')) return true;
  return true; // TEMP: open access while testing — set to false for production
};

const CV_TEMPLATES = [
  // ── ROW 1: Engineering & Construction ──
  {
    id: 'civil-engineering',
    name: 'Civil Engineering',
    tag: 'PREMIUM',
    color: '#0891b2',
    description: 'Graduate civil engineer with placement experience in highways, drainage and infrastructure design.',
    preview: ['Highway design', 'Drainage modelling', 'Site surveying'],
    data: {
      personal: { fullName: 'Ravi Patel', title: 'MEng Civil Engineering Graduate', email: 'ravi.patel@email.com', phone: '+44 7700 900456', location: 'Bristol, United Kingdom', linkedin: 'linkedin.com/in/ravipatel-eng', website: '' },
      summary: 'Results-oriented civil engineering graduate with a Master\'s degree and 18 months of industry placement experience across residential construction, water infrastructure and transport planning. Core competencies in hydraulic modelling (MicroDrainage, InfoWorks ICM), highway design (Civil 3D) and geotechnical analysis. Delivered flood risk assessments for planning applications and contributed to drainage designs achieving full Sewers for Adoption compliance. Experienced in stakeholder coordination with local authorities, design teams and utility providers. Seeking a graduate role where data-driven engineering analysis and cross-functional collaboration drive safe, sustainable infrastructure delivery.',
      experience: [
        { role: 'Graduate Design Engineer', company: 'Whitmore Civils Partnership', dates: 'Jul 2024 – Dec 2024', location: 'Bristol, UK', bullets: [
          'Achieved full Sewers for Adoption compliance for a 120-unit housing estate, as verified by the adopting water authority, by preparing drainage layout calculations and pipe sizing schedules in MicroDrainage.',
          'Reduced design coordination clashes by 30% across two estate access road projects, as measured by weekly clash resolution logs, by drafting road geometry and pavement build-up designs in Civil 3D aligned with utility service corridors.',
          'Secured planning approval for two flood risk assessments, as confirmed by the local planning authority, by modelling surface water runoff scenarios and producing technical reports within a four-week deadline.',
        ]},
        { role: 'Year-in-Industry Placement Engineer', company: 'Greystone Water & Environment', dates: 'Jul 2022 – Jul 2023', location: 'Cardiff, UK', bullets: [
          'Identified a 15% capacity shortfall in a 4 km trunk sewer network, as quantified through InfoWorks ICM storm simulations, by performing hydraulic modelling under 1-in-30-year and 1-in-100-year return period scenarios.',
          'Accelerated pumping station design delivery by two weeks ahead of programme, as tracked on the project Gantt chart, by producing layout drawings and equipment specification schedules in Civil 3D.',
          'Improved earthworks cost accuracy by 10% on a reservoir embankment upgrade, as validated against final quantities, by assisting senior engineers with cut-fill balance assessments using Excel-based volume models.',
        ]},
        { role: 'Site Surveying Assistant (Summer)', company: 'Oakmead Construction Services', dates: 'Jun 2021 – Sept 2021', location: 'Exeter, UK', bullets: [
          'Delivered topographic survey data with sub-10 mm positional accuracy for a highway improvement scheme, as verified by the project surveyor, by operating GPS and total station equipment to establish control points.',
          'Reduced drawing revision cycles by compiling as-built drainage measurements directly into AutoCAD, enabling the design team to issue updated plans within 24 hours of site completion.',
        ]},
      ],
      education: [
        { institution: 'University of Bristol', degree: 'MEng Civil Engineering', dates: 'Sept 2020 – Jul 2024', grade: 'First Class Honours' },
      ],
      skills: ['Software: AutoCAD, Civil 3D, MicroDrainage, InfoWorks ICM, ETABS, Revit, Excel', 'Technical: Hydraulic Modelling, Flood Risk Assessment, Geotechnical Analysis', 'Compliance: CDM Regulations, Sewers for Adoption, Technical Report Writing'],
      certifications: ['ICE Student Member', 'CSCS Card — Green (Labourer)', 'First Aid at Work — British Red Cross', 'IOSH Managing Safely'],
    },
  },
  {
    id: 'structural-engineering',
    name: 'Structural Engineering',
    tag: 'PREMIUM',
    color: '#059669',
    description: 'Structural design graduate with hands-on site and consultancy placement experience.',
    preview: ['Eurocode design', 'FE modelling', 'Site engineering'],
    data: {
      personal: { fullName: 'Carlos Medina', title: 'Civil & Structural Engineering Graduate', email: 'carlos.medina@email.com', phone: '+44 7700 900789', location: 'London, United Kingdom', linkedin: 'linkedin.com/in/carlosmedina', website: '' },
      summary: 'Technically proficient structural engineering graduate with postgraduate training in advanced analysis and practical placement experience across commercial building design and transport infrastructure. Core competencies in finite element modelling (ETABS, SAP2000), Eurocode-compliant RC and steel design, and site engineering supervision. Consistently delivered design calculations ahead of programme deadlines while maintaining full compliance with BS EN 1992 and BS EN 1993. Proficient in BIM coordination, clash detection and interdisciplinary design collaboration. Seeking a graduate structural role where analytical precision and safety-first engineering underpin every project.',
      experience: [
        { role: 'Graduate Structural Engineer', company: 'Harland Walker Consulting', dates: 'Aug 2023 – Dec 2023', location: 'Manchester, UK', bullets: [
          'Achieved zero design non-conformances on a six-storey mixed-use development, as confirmed during the Stage 4 design review, by producing beam and column calculations verified against Eurocode 2 and Eurocode 3 requirements.',
          'Reduced drawing issue turnaround by 25%, as measured by the project tracker, by creating general arrangement drawings and reinforcement schedules in AutoCAD for two commercial fit-out projects totalling 2,400 m².',
          'Resolved 8 interdisciplinary clashes before construction stage, as logged in the BIM coordination register, by participating in weekly design meetings with architects and MEP consultants and tracking issues in Revit.',
        ]},
        { role: 'Site Engineering Placement', company: 'Redwood Construction Group', dates: 'Jan 2023 – Jul 2023', location: 'Birmingham, UK', bullets: [
          'Maintained 100% compliance with approved construction drawings across all concrete pour and steel erection activities, as verified through daily inspection checklists, by monitoring works against specifications on a new secondary school build.',
          'Flagged three scheduling risks two weeks before they impacted the critical path, as acknowledged by the project manager, by completing daily site diaries recording progress, weather and resource deployment.',
          'Achieved setting-out accuracy within ±3 mm for ground-floor slab works, as confirmed by independent survey checks, by carrying out level surveys using total station and laser level equipment.',
        ]},
        { role: 'Engineering Intern', company: 'Bridgepoint Infrastructure Ltd', dates: 'Jun 2021 – Dec 2022', location: 'Leeds, UK', bullets: [
          'Contributed to four bridge condition assessment reports delivered on schedule to local authority clients, as tracked in the project management system, by measuring defects and compiling survey data in standardised templates.',
          'Validated FE model outputs with less than 5% variance against hand calculations, as documented in the design verification log, by modelling beam and frame structures in ETABS under serviceability load combinations.',
        ]},
      ],
      education: [
        { institution: 'University of East London', degree: 'MSc Structural Engineering', dates: 'Jan 2024 – May 2025', grade: 'Distinction (Expected)' },
        { institution: 'University of East London', degree: 'BEng (Hons) Civil Engineering', dates: 'Sept 2019 – Jul 2023', grade: 'Upper Second Class (2:1)' },
      ],
      skills: ['Software: ETABS, SAP2000, SAFE, STAAD.Pro, Tekla Structures, Abaqus CAE, AutoCAD, Revit', 'Technical: Finite Element Analysis, Eurocode Design (EC2/EC3), Reinforced Concrete, Structural Steel', 'Compliance: CDM Regulations, BIM Coordination, Technical Report Writing'],
      certifications: ['ICE Student Member', 'CSCS Card — Green (Labourer)', 'First Aid at Work — St John Ambulance', 'Manual Handling Awareness — HSE Certified'],
    },
  },
  {
    id: 'quantity-surveyor',
    name: 'Quantity Surveyor',
    tag: 'PREMIUM',
    color: '#7c3aed',
    description: 'Graduate QS with experience in cost planning, procurement and contract administration.',
    preview: ['Cost management', 'Procurement', 'Contract admin'],
    data: {
      personal: { fullName: 'Priya Sharma', title: 'BSc Quantity Surveying Graduate', email: 'priya.sharma@email.com', phone: '+44 7700 900321', location: 'Birmingham, United Kingdom', linkedin: 'linkedin.com/in/priyasharma-qs', website: '' },
      summary: 'Commercially astute quantity surveying graduate with 12 months of placement experience across residential and commercial construction projects valued up to £11M. Core competencies in elemental cost planning (NRM1/NRM2), bill of quantities preparation (CostX), interim valuations and subcontractor procurement under JCT contracts. Consistently benchmarked cost estimates within 5% of final outturn figures. Skilled in contract administration, variation management and client-facing cost reporting. Seeking a graduate QS role where financial accuracy, contract awareness and proactive cost control protect project budgets and client interests.',
      experience: [
        { role: 'Assistant Quantity Surveyor (Placement)', company: 'Thornfield Cost Consultants', dates: 'Jul 2023 – Jul 2024', location: 'Birmingham, UK', bullets: [
          'Achieved cost estimate accuracy within 4% of tender returns across three residential schemes valued between £2M and £8M, as validated at post-tender analysis, by benchmarking elemental rates against BCIS data in CostX.',
          'Accelerated monthly payment cycles by five working days, as tracked by the contract administrator, by compiling interim valuation schedules and payment recommendations using NRM2 measurement rules.',
          'Resolved 12 contractor variation claims within agreed timescales, as logged in the contract variation register, by attending site progress meetings, recording minutes and tracking claims through to close-out.',
        ]},
        { role: 'Trainee QS (Summer Placement)', company: 'Centurion Builders Ltd', dates: 'Jun 2022 – Sept 2022', location: 'Coventry, UK', bullets: [
          'Reduced subcontractor procurement cycle time by 20%, as measured against previous project benchmarks, by preparing tender packages, distributing enquiries and compiling comparison spreadsheets for six trade packages.',
          'Identified £45K in over-measured brickwork and roofing quantities, as flagged to the senior QS, by measuring completed works against contract drawings and applying NRM2 rules.',
          'Maintained a cost and variation register for an £11M school extension with 100% data accuracy, as confirmed during client audit, by logging 45+ change instructions over three months.',
        ]},
        { role: 'Retail Sales Associate', company: 'Kingsley Home Furnishings', dates: 'Sept 2020 – May 2022', location: 'Birmingham, UK', bullets: [
          'Achieved 100% compliance with 24-hour service level targets for customer order resolution, as tracked by the branch management system, by managing orders and delivery queries using the company inventory platform.',
        ]},
      ],
      education: [
        { institution: 'Birmingham City University', degree: 'BSc (Hons) Quantity Surveying', dates: 'Sept 2020 – Jul 2024', grade: 'First Class Honours' },
      ],
      skills: ['Software: CostX, Microsoft Excel, BCIS, AutoCAD, Bluebeam Revu', 'Commercial: Elemental Cost Planning, Bill of Quantities, Interim Valuations, Variation Management', 'Contracts: JCT Administration, NRM1/NRM2, Subcontractor Procurement'],
      certifications: ['RICS Associate Member (AssocRICS)', 'CSCS Card — Green (Labourer)', 'IOSH Managing Safely Certificate', 'NEC4 Project Manager Accreditation'],
    },
  },

  // ── ROW 2: Specialist Engineering & Data ──
  {
    id: 'ground-engineering',
    name: 'Ground Engineering',
    tag: 'PREMIUM',
    color: '#b45309',
    description: 'Geotechnical and ground engineering graduate with fieldwork and laboratory experience.',
    preview: ['Site investigation', 'Soil testing', 'Foundation design'],
    data: {
      personal: { fullName: 'Hannah Clarke', title: 'Geotechnical Engineering Graduate', email: 'hannah.clarke@email.com', phone: '+44 7700 900654', location: 'Leeds, United Kingdom', linkedin: 'linkedin.com/in/hannaclarke-geo', website: '' },
      summary: 'Detail-driven geotechnical engineering graduate with 12 months of laboratory and fieldwork placement experience across ground investigation, BS 1377 soil testing and geotechnical design. Core competencies in PLAXIS 2D finite element modelling, foundation bearing capacity calculations (Terzaghi/Meyerhof) and slope stability analysis (GeoStudio SLOPE/W). Delivered factual ground investigation reports that met UKAS accreditation standards. Experienced in borehole logging, CPT data interpretation and soil classification to BS EN ISO 14688. Seeking a graduate ground engineering role where rigorous site characterisation and analytical precision support safe foundation and earthworks design.',
      experience: [
        { role: 'Graduate Geotechnical Engineer', company: 'Fieldstone Ground Engineering', dates: 'Aug 2024 – Jan 2025', location: 'Leeds, UK', bullets: [
          'Delivered five factual ground investigation reports on schedule to transport and housing clients, as tracked on the project delivery dashboard, by interpreting borehole logs and CPT data against BS EN ISO 14688 classification standards.',
          'Validated PLAXIS 2D retaining wall model outputs within 3% of hand calculations, as documented in the design check certificate, by modelling a 12 m deep propped wall and performing sensitivity analysis on soil parameters.',
          'Reduced foundation over-design by 12% on two housing projects, as measured by concrete volume savings, by performing bearing capacity and settlement calculations using Terzaghi and Meyerhof methods with site-specific parameters.',
        ]},
        { role: 'Geotechnical Placement Technician', company: 'Ridgeway Soils Laboratory', dates: 'Jun 2022 – Jun 2023', location: 'Sheffield, UK', bullets: [
          'Maintained 100% UKAS accreditation compliance across all test procedures, as confirmed during the annual external audit, by conducting triaxial, oedometer and direct shear tests in accordance with BS 1377.',
          'Processed and catalogued 200+ soil samples with zero mis-labelling incidents, as verified by the laboratory QA manager, by logging disturbed and undisturbed specimens from rotary and cable percussion boreholes.',
          'Improved equipment calibration turnaround time by 15%, as measured against the previous quarterly average, by implementing a weekly calibration schedule with standardised check-sheets.',
        ]},
        { role: 'Construction Site Assistant (Summer)', company: 'Wellbrook Civil Contractors', dates: 'Jul 2021 – Sept 2021', location: 'York, UK', bullets: [
          'Supported earthworks setting-out with zero rework incidents on a new-build residential development, as confirmed by the site engineer, by assisting with levelling tasks using automatic level and staff.',
        ]},
      ],
      education: [
        { institution: 'University of Leeds', degree: 'BEng (Hons) Civil & Geotechnical Engineering', dates: 'Sept 2020 – Jul 2024', grade: 'Upper Second Class (2:1)' },
      ],
      skills: ['Software: PLAXIS 2D, GeoStudio (SLOPE/W), AutoCAD, Microsoft Excel', 'Technical: Foundation Design, Slope Stability Analysis, Retaining Wall Design, Borehole Logging', 'Standards: BS 1377 Soil Testing, BS EN ISO 14688, UKAS Laboratory QA, Technical Reporting'],
      certifications: ['ICE Student Member', 'CSCS Card — Green (Labourer)', 'First Aid at Work — Red Cross', 'Manual Handling Awareness Certificate'],
    },
  },
  {
    id: 'data-analytics',
    name: 'Data Analytics',
    tag: 'PREMIUM',
    color: '#2563eb',
    description: 'Graduate data analyst with experience in dashboards, SQL and statistical modelling.',
    preview: ['SQL & Python', 'Power BI dashboards', 'Statistical analysis'],
    data: {
      personal: { fullName: 'Amara Johnson', title: 'Data Analytics Graduate', email: 'amara.johnson@email.com', phone: '+44 7700 900987', location: 'Manchester, United Kingdom', linkedin: 'linkedin.com/in/amarajohnson-data', website: '' },
      summary: 'Impact-driven data science graduate with 12 months of placement experience in business intelligence, ETL pipeline development and statistical modelling. Core competencies in Python (pandas, scikit-learn), SQL (PostgreSQL), Power BI and R. Automated monthly reporting workflows saving 24+ hours of manual effort and delivered A/B test analyses that drove measurable uplift in marketing KPIs. Proficient in data visualisation, dashboard design and communicating insights to non-technical stakeholders. Seeking a graduate analyst role where rigorous data wrangling and clear stakeholder storytelling translate into actionable business decisions.',
      experience: [
        { role: 'Junior Data Analyst (Placement)', company: 'Clearpoint Retail Analytics', dates: 'Jul 2023 – Jul 2024', location: 'Manchester, UK', bullets: [
          'Increased regional management adoption of data-driven reviews by 100%, as measured by weekly active dashboard users, by building interactive Power BI dashboards tracking sales KPIs across 60+ store locations.',
          'Saved 24 hours of manual effort per month, as quantified by team time-tracking logs, by writing SQL queries in PostgreSQL to extract, transform and automate three recurring monthly reports.',
          'Lifted email marketing open rates by 12 percentage points, as measured by Mailchimp campaign analytics, by conducting A/B test analysis and recommending the higher-performing subject-line variant.',
          'Improved customer data quality to 99.2% completeness, as verified by automated validation scripts, by cleaning a 250K+ record dataset using Python pandas to resolve duplicates and missing postcode fields.',
        ]},
        { role: 'Research Data Assistant', company: 'University of Manchester — Social Sciences', dates: 'Jan 2023 – Jun 2023', location: 'Manchester, UK', bullets: [
          'Contributed to two peer-reviewed working papers, as confirmed by the research lead, by producing descriptive statistics and correlation tables in R from a longitudinal study of 4,000 participants.',
          'Delivered five conference-ready visualisations summarising demographic trends across UK regions, as used by the principal investigator, by creating publication-quality charts in ggplot2.',
        ]},
        { role: 'Customer Service Advisor', company: 'Greenfield Telecom', dates: 'Sept 2020 – Dec 2022', location: 'Manchester, UK', bullets: [
          'Maintained a 95% first-call resolution rate over two years handling 40+ daily queries, as tracked by the call centre CRM, by applying structured troubleshooting workflows and escalation protocols.',
        ]},
      ],
      education: [
        { institution: 'University of Manchester', degree: 'BSc (Hons) Data Science', dates: 'Sept 2020 – Jul 2024', grade: 'First Class Honours' },
      ],
      skills: ['Languages: Python (pandas, scikit-learn), SQL (PostgreSQL), R / ggplot2', 'Tools: Power BI, Tableau, Microsoft Excel, Apache Airflow', 'Methods: Statistical Modelling, A/B Testing, ETL Pipelines, Data Wrangling, Data Visualisation'],
      certifications: ['Google Data Analytics Certificate', 'Microsoft Power BI Data Analyst Associate', 'IBM Data Science Professional Certificate', 'HackerRank SQL (Intermediate)'],
    },
  },
  {
    id: 'fullstack-developer',
    name: 'Junior Full Stack Developer',
    tag: 'PREMIUM',
    color: '#dc2626',
    description: 'Graduate full stack developer with React, Node.js and database experience.',
    preview: ['React & Node.js', 'REST APIs', 'Agile teamwork'],
    data: {
      personal: { fullName: 'Ethan Brooks', title: 'Junior Full Stack Developer', email: 'ethan.brooks@email.com', phone: '+44 7700 900543', location: 'London, United Kingdom', linkedin: 'linkedin.com/in/ethanbrooks-dev', website: '' },
      summary: 'Delivery-focused computer science graduate with 12 months of placement experience building production React/Node.js applications serving 5,000+ monthly active users. Core competencies in JavaScript/TypeScript, RESTful API design, PostgreSQL database management and CI/CD pipeline configuration. Achieved 90%+ test coverage on all delivered features and maintained a zero-downtime deployment record across 12 sprint cycles. Experienced in responsive design, accessibility standards and cross-browser testing. Seeking a junior developer role in a product team where clean code, peer review culture and Agile practices drive rapid, reliable software delivery.',
      experience: [
        { role: 'Junior Software Developer (Placement)', company: 'Horizon Digital Products', dates: 'Jul 2023 – Jul 2024', location: 'London, UK', bullets: [
          'Increased SaaS dashboard engagement by 18%, as measured by product analytics (Mixpanel), by developing a filterable data table and CSV export feature in React for 5,000+ monthly active users.',
          'Achieved 90%+ integration test coverage on all new API endpoints, as tracked by Jest coverage reports, by building RESTful endpoints in Node.js/Express with input validation and structured error handling.',
          'Delivered a multi-tenant PostgreSQL schema migration with zero downtime, as confirmed by the uptime monitoring dashboard, by coordinating deployment sequencing with the DevOps team using Docker and GitHub Actions.',
          'Shipped 95% of sprint commitments on time across 12 sprints, as tracked in Jira velocity reports, by estimating tickets in story points and participating in fortnightly sprint planning and daily standups.',
        ]},
        { role: 'Web Development Intern (Summer)', company: 'Spark Creative Agency', dates: 'Jun 2022 – Sept 2022', location: 'Brighton, UK', bullets: [
          'Delivered three client marketing websites on time and within budget, as confirmed by the project manager, by building responsive layouts in HTML, CSS, JavaScript and WordPress.',
          'Achieved 95+ Lighthouse accessibility scores on all three sites, as verified by automated CI audits, by implementing semantic HTML, ARIA attributes and responsive design patterns tested across Chrome, Safari and Firefox.',
        ]},
        { role: 'IT Support Technician', company: 'Westfield Sixth Form College', dates: 'Sept 2019 – Jun 2020', location: 'London, UK', bullets: [
          'Resolved 98% of support tickets within SLA response times serving 800 students and 60 staff, as tracked by the ServiceDesk system, by providing first-line hardware and software troubleshooting.',
        ]},
      ],
      education: [
        { institution: 'University of Sussex', degree: 'BSc (Hons) Computer Science', dates: 'Sept 2020 – Jul 2024', grade: 'First Class Honours' },
      ],
      skills: ['Frontend: JavaScript/TypeScript, React, HTML/CSS, Figma', 'Backend: Node.js/Express, PostgreSQL, REST APIs, Docker', 'Practices: Git/GitHub, Jest/Testing Library, CI/CD (GitHub Actions), Agile/Scrum'],
      certifications: ['AWS Cloud Practitioner', 'freeCodeCamp Full Stack Certification', 'Scrum Foundation Professional (SFPC)', 'HackerRank JavaScript (Intermediate)'],
    },
  },

  // ── ROW 3: Tech, Operations & Professional ──
  {
    id: 'ai-developer',
    name: 'Junior AI Developer',
    tag: 'PREMIUM',
    color: '#7c3aed',
    description: 'Graduate AI/ML developer with experience in model building, NLP and data pipelines.',
    preview: ['Machine learning', 'NLP & LLMs', 'Python / TensorFlow'],
    data: {
      personal: { fullName: 'Zara Okonkwo', title: 'Junior AI / Machine Learning Developer', email: 'zara.okonkwo@email.com', phone: '+44 7700 900876', location: 'London, United Kingdom', linkedin: 'linkedin.com/in/zaraokonkwo-ai', website: '' },
      summary: 'Research-minded AI developer with a Master\'s distinction in Applied Machine Learning and 12 months of placement experience building production ML pipelines. Core competencies in Python, TensorFlow/Keras, PyTorch, Hugging Face Transformers and scikit-learn. Deployed a BERT-based text classification model achieving 91% F1-score in production and automated preprocessing pipelines that cut model training prep time by 90%. Experienced in model evaluation, A/B experimentation, MLOps deployment and translating research findings into production-ready features. Seeking a junior AI role where rigorous experimentation, clean engineering and measurable product impact converge.',
      experience: [
        { role: 'Machine Learning Engineer Intern', company: 'NovaMind AI Labs', dates: 'Jul 2024 – Dec 2024', location: 'London, UK', bullets: [
          'Achieved 91% F1-score on customer support ticket routing, as measured by held-out evaluation metrics, by developing a text classification pipeline using fine-tuned BERT models via Hugging Face Transformers.',
          'Reduced model training preparation time from 4 hours to 25 minutes (90% reduction), as benchmarked against legacy scripts, by building automated data preprocessing pipelines in Python with pandas and NumPy.',
          'Served 10K+ daily predictions in production with 99.7% uptime, as tracked by Datadog monitoring, by collaborating with the product team to deploy a recommendation engine via FastAPI behind an AWS load balancer.',
        ]},
        { role: 'Data Science Placement Student', company: 'Crestview Health Analytics', dates: 'Jul 2022 – Jul 2023', location: 'Cambridge, UK', bullets: [
          'Improved patient readmission prediction accuracy to 84% AUC-ROC, as validated on a held-out test set, by training and evaluating random forest and gradient boosting classifiers using scikit-learn.',
          'Increased data freshness from weekly to daily updates, as confirmed by the pipeline monitoring dashboard, by designing ETL pipelines in Apache Airflow to ingest and transform clinical datasets.',
          'Enabled the research director to present ML findings to clinical stakeholders, as used in two board presentations, by creating Jupyter Notebook reports with interactive visualisations documenting feature importance.',
        ]},
        { role: 'Maths & Coding Tutor', company: 'BrightPath Tutoring', dates: 'Sept 2020 – Jun 2022', location: 'London, UK', bullets: [
          'Improved student pass rates by 90% across a cohort of 15+ GCSE and A-level learners, as measured by exam results, by delivering personalised lessons in mathematics and Python programming.',
        ]},
      ],
      education: [
        { institution: 'Imperial College London', degree: 'MSc Applied Machine Learning', dates: 'Sept 2023 – Sept 2024', grade: 'Distinction' },
        { institution: 'Queen Mary University of London', degree: 'BSc (Hons) Computer Science', dates: 'Sept 2019 – Jul 2022', grade: 'First Class Honours' },
      ],
      skills: ['ML Frameworks: TensorFlow/Keras, PyTorch, scikit-learn, Hugging Face Transformers', 'Languages & Tools: Python, SQL, FastAPI, Apache Airflow, Docker, Git/GitHub', 'Specialisms: NLP/LLMs, MLOps, Model Deployment, Data Pipeline Engineering'],
      certifications: ['DeepLearning.AI TensorFlow Developer Certificate', 'AWS Machine Learning Specialty', 'Google Cloud Professional ML Engineer', 'Kaggle Competitions Expert'],
    },
  },
  {
    id: 'operations-support',
    name: 'Operations Support',
    tag: 'PREMIUM',
    color: '#0891b2',
    description: 'Graduate operations coordinator with experience in logistics, process improvement and stakeholder management.',
    preview: ['Process improvement', 'Logistics coordination', 'Stakeholder management'],
    data: {
      personal: { fullName: 'Jordan Rivera', title: 'Operations & Business Support Graduate', email: 'jordan.rivera@email.com', phone: '+44 7700 900234', location: 'London, United Kingdom', linkedin: 'linkedin.com/in/jordanrivera', website: '' },
      summary: 'Process-oriented business graduate with 12 months of operations placement experience spanning logistics coordination, SAP ERP administration and workflow optimisation. Core competencies in dispatch scheduling, invoice reconciliation, KPI dashboard reporting (Power BI) and Lean process mapping. Delivered workflow improvements that reduced returns processing time by 20% and maintained 98% on-time delivery rates across a 35-vehicle fleet. Skilled in cross-departmental coordination, vendor management and end-to-end process documentation. Seeking a graduate operations role where data-driven efficiency gains and clear stakeholder communication drive continuous improvement.',
      experience: [
        { role: 'Operations Coordinator (Placement)', company: 'Maplewood Distribution Ltd', dates: 'Jul 2023 – Jul 2024', location: 'London, UK', bullets: [
          'Maintained 98% on-time delivery across London and the South East, as tracked by the fleet management system, by coordinating daily dispatch schedules for 35 vehicles and proactively re-routing around disruptions.',
          'Reduced invoice discrepancy rate from 8% to 2%, as measured by the monthly reconciliation report, by processing 150+ weekly purchase orders and goods receipts in SAP and flagging mismatches within 24 hours.',
          'Cut average returns processing time by 20%, as benchmarked against the previous quarter, by mapping the end-to-end returns workflow, identifying three bottlenecks and implementing revised handover procedures.',
          'Enabled data-driven decision-making for the operations director, as evidenced by adoption in weekly leadership meetings, by preparing KPI packs in Power BI visualising delivery performance, stock levels and complaint trends.',
        ]},
        { role: 'Business Admin Intern (Summer)', company: 'Clearwater Property Management', dates: 'Jun 2022 – Sept 2022', location: 'Reading, UK', bullets: [
          'Achieved 100% data accuracy for the annual property portfolio audit, as verified by the compliance team, by updating lease renewal dates and safety certificates in the property management database.',
          'Reduced average tenant enquiry response time from 48 hours to same-day, as tracked by the inbox SLA log, by triaging 50+ daily emails and routing maintenance requests to the correct contractor.',
        ]},
        { role: 'Retail Team Member', company: 'Evergreen Supermarkets', dates: 'Sept 2019 – May 2022', location: 'London, UK', bullets: [
          'Maintained shelf availability above 97% across three product categories, as measured by weekly availability audits, by managing stock replenishment schedules and coordinating with the warehouse team.',
        ]},
      ],
      education: [
        { institution: 'University of Reading', degree: 'BSc (Hons) Business Management', dates: 'Sept 2020 – Jul 2024', grade: 'Upper Second Class (2:1)' },
      ],
      skills: ['Software: SAP ERP, Microsoft Excel, Microsoft 365, Power BI, Trello/Asana', 'Operations: Supply Chain Logistics, Fleet Coordination, Invoice Reconciliation, Lean Process Mapping', 'Professional: KPI Reporting, Stakeholder Communication, Continuous Improvement'],
      certifications: ['PRINCE2 Foundation', 'Lean Six Sigma Yellow Belt', 'IOSH Managing Safely', 'Microsoft Office Specialist — Excel'],
    },
  },
  {
    id: 'grc-learning-development',
    name: 'GRC & Learning Development',
    tag: 'PREMIUM',
    color: '#d97706',
    description: 'Graduate in governance, risk, compliance and L&D with audit and training programme experience.',
    preview: ['Risk & compliance', 'Training programmes', 'Policy frameworks'],
    data: {
      personal: { fullName: 'Alex Morgan', title: 'Governance, Risk & Compliance Analyst', email: 'alex.morgan@email.com', phone: '+44 7700 900123', location: 'London, United Kingdom', linkedin: 'linkedin.com/in/alexmorgan', website: '' },
      summary: 'Standards-driven governance and compliance professional with hands-on experience conducting internal audits, building GDPR/ISO 27001 control frameworks and designing employee training programmes. Core competencies in risk register management, data protection impact assessments, compliance dashboard automation (Power BI) and L&D content creation (Articulate Rise). Reduced non-compliance incidents by 40% and improved AML training pass rates from 62% to 94%. Adept at policy writing, stakeholder engagement and translating regulatory requirements into practical operational controls. Seeking a graduate GRC or L&D role where regulatory rigour, clear communication and measurable learning outcomes protect organisational integrity.',
      experience: [
        { role: 'Risk & Compliance Coordinator', company: 'Meridian Financial Services', dates: 'Sept 2023 - Present', location: 'London, UK', bullets: [
          'Reduced non-compliance incidents by 40% across four business units, as measured by the quarterly audit findings register, by coordinating internal audit cycles and implementing corrective actions for 12 identified control gaps.',
          'Achieved successful ICO correspondence with zero enforcement actions, as confirmed by the DPO, by drafting and maintaining data protection impact assessments aligned with GDPR Articles 35 and 36.',
          'Saved the governance team 15 hours per month of manual effort, as quantified by time-tracking comparisons, by building automated compliance tracking dashboards in Power BI with real-time status indicators.',
          'Improved AML awareness training pass rates from 62% to 94%, as measured by post-assessment scores, by designing and delivering a mandatory programme for 80+ staff using scenario-based learning techniques.',
        ]},
        { role: 'Learning & Development Assistant', company: 'Atlas Professional Services', dates: 'Jan 2022 - Aug 2023', location: 'London, UK', bullets: [
          'Achieved a 4.6/5 average learner satisfaction rating across all e-learning modules, as measured by post-course surveys, by producing content on information security, GDPR and workplace conduct using Articulate Rise.',
          'Onboarded 120 new LMS users per quarter with zero access issues, as tracked by the platform admin log, by administering the company learning management system and maintaining course completion dashboards.',
          'Delivered 15 in-person training workshops with 95% attendance rates, as recorded in the L&D tracker, by coordinating logistics including room bookings, materials preparation and post-session feedback collection.',
        ]},
        { role: 'Compliance Intern', company: 'Oakfield Insurance Group', dates: 'Jun 2021 - Dec 2021', location: 'Cambridge, UK', bullets: [
          'Identified 18 documentation discrepancies against FCA regulatory standards, as logged in the compliance exceptions register, by reviewing policyholder files and flagging non-conformances to senior officers.',
          'Achieved 100% completion rate for the annual compliance training rollout across 200+ employees, as tracked by the HR system, by preparing content briefs and sending targeted reminders to outstanding participants.',
        ]},
      ],
      education: [
        { institution: 'University of East London', degree: 'BSc (Hons) Information Security & Digital Forensics — First Class', dates: '', grade: '' },
        { institution: 'University of Northampton', degree: 'HND Business & Management — Distinction', dates: '', grade: '' },
      ],
      skills: ['Compliance: ISO 27001/NIST, GDPR/Data Protection, GRC Frameworks, Internal Auditing', 'L&D: Articulate Rise/Storyline, Learning Management Systems, Training Needs Analysis', 'Tools & Methods: Power BI, Risk Register Management, Policy Development, Stakeholder Engagement'],
      certifications: ['CompTIA Security+', 'ISO 27001 Lead Implementer — PECB', 'CIPD Level 3 Foundation in L&D', 'PRINCE2 Foundation'],
    },
  },
];

// ── Structured CV → plain text (for code editor) ──
const cvDataToText = (d) => {
  const lines = [];
  const { personal: p, summary, experience, education, skills, certifications } = d;

  // Header
  lines.push(p.fullName || 'Your Name');
  if (p.title) lines.push(p.title);
  const contactParts = [p.email, p.phone, p.location, p.linkedin, p.website].filter(Boolean);
  if (contactParts.length) lines.push(contactParts.join(' | '));
  lines.push('');

  // Summary
  if (summary) {
    lines.push('PROFESSIONAL SUMMARY');
    lines.push(summary);
    lines.push('');
  }

  // Education
  if (education.length) {
    lines.push('EDUCATION');
    education.forEach(e => {
      const right = [e.dates, e.grade].filter(Boolean).join(' - ');
      lines.push(`${e.institution || 'Institution'}${right ? '  |  ' + right : ''}`);
      if (e.degree) lines.push(e.degree);
      lines.push('');
    });
  }

  // Experience
  if (experience.length) {
    lines.push('EXPERIENCE');
    experience.forEach(e => {
      lines.push(`${e.role || 'Role'}  |  ${e.dates || ''}`);
      if (e.company || e.location) lines.push([e.company, e.location].filter(Boolean).join(', '));
      e.bullets.forEach(b => { if (b.trim()) lines.push('• ' + b); });
      lines.push('');
    });
  }

  // Skills
  if (skills.length) {
    lines.push('SKILLS');
    lines.push(skills.filter(s => s.trim()).join(', '));
    lines.push('');
  }

  // Certifications
  if (certifications.length) {
    lines.push('CERTIFICATIONS & AWARDS');
    certifications.forEach(c => { if (c.trim()) lines.push('• ' + c); });
    lines.push('');
  }

  return lines.join('\n');
};


/* ═══════════════════════════════════════════════════════════════════════════
   PARSER: Raw text → structured CV data
   ─────────────────────────────────────────────────────────────────────────
   Designed for diverse CV formats worldwide. Key strategies:
     1. Date-range anchoring for experience & education (most reliable signal)
     2. Universal location detection (City, State/Country patterns)
     3. International name support (Unicode-aware)
     4. Sub-header filtering (KEY ACCOMPLISHMENTS, etc.)
     5. Category:value skills parsing (e.g., "Programming: Python, Java")
     6. Robust section detection with 30+ header variations
   ═══════════════════════════════════════════════════════════════════════════ */

// ── Shared date patterns used across experience & education parsers ──
const MONTH_NAMES = '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';
// Month Year – Month Year  OR  Month Year – Present
const DATE_RANGE_FULL = new RegExp(
  `${MONTH_NAMES}\\w*[\\s.,-]+\\d{4}\\s*[-–—to]+\\s*(?:Present|Current|Now|Ongoing|${MONTH_NAMES}\\w*[\\s.,-]*\\d{4})`, 'i'
);
// Year – Year  OR  Year – Present
const DATE_RANGE_SHORT = /\b(\d{4})\s*[-–—to]+\s*(Present|Current|Now|Ongoing|\d{4})\b/i;
// MM/YYYY – MM/YYYY
const DATE_RANGE_SLASH = /\b\d{1,2}\/\d{4}\s*[-–—to]+\s*(?:Present|Current|Now|Ongoing|\d{1,2}\/\d{4})\b/i;
// Standalone year like (2021) for education
const STANDALONE_YEAR = /\b(20\d{2}|19\d{2})\b/;

// ── Sub-headers that should NOT become bullets ──
const SUBHEADER_NOISE = /^(key\s+accomplishments?|key\s+achievements?|key\s+responsibilities|responsibilities|duties|projects?|notable\s+projects?|selected\s+achievements?|highlights?)\s*:?\s*$/i;

// ── Helper: match any date range in a line ──
const matchDateRange = (line) =>
  line.match(DATE_RANGE_FULL) || line.match(DATE_RANGE_SLASH) || line.match(DATE_RANGE_SHORT);

// ── Helper: detect if line looks like a company/org indicator ──
const COMPANY_INDICATORS = /\b(ltd|limited|inc|incorporated|corp|corporation|llc|llp|plc|gmbh|s\.?a\.?|pvt|pty|co\.|group|partners|consulting|solutions|technologies|services|agency|foundation|charity|ngo|nhs|council)\b/i;

// ── Helper: detect if line is a location ──
const LOCATION_PATTERN = /\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\s*,\s*(?:[A-Z]{2,3}|[A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\b/;

// ── Helper: detect "Role | Company" or "Role, Company" patterns mid-stream ──
const ROLE_KEYWORDS = /\b(manager|engineer|developer|analyst|designer|consultant|intern|trainee|coordinator|specialist|administrator|officer|assistant|associate|director|lead|head|supervisor|executive|representative|advisor|adviser|architect|scientist|researcher|strategist|planner|controller|auditor|compliance|governance|team\s+lead)\b/i;

// ── Helper: detect if a non-bullet line is a new role header (Role | Company or Role, Company) ──
const isRoleHeader = (line) => {
  const clean = line.replace(/^[•\-*▪◦→⋅●○■□✓✔]\s*/, '').trim();
  // Must NOT start with a bullet marker
  if (/^[•\-*▪◦→⋅●○■□✓✔]/.test(line)) return false;
  // Must be reasonably short (role headers are < 80 chars typically)
  if (clean.length > 80 || clean.length < 8) return false;
  // Pattern: "Role | Company" or "Role | Organization"
  if (/\|/.test(clean) && ROLE_KEYWORDS.test(clean.split('|')[0])) return true;
  // Pattern: "Role at Company" or "Role @ Company"
  if (/\s+(?:at|@)\s+/i.test(clean) && ROLE_KEYWORDS.test(clean.split(/\s+(?:at|@)\s+/i)[0])) return true;
  // Line contains a role keyword AND doesn't start with an action verb (which would be a bullet)
  const ACTION_START = /^(managed|led|developed|created|built|designed|implemented|delivered|achieved|improved|increased|reduced|coordinated|organized|conducted|executed|assessed|provided|maintained|applied|forged|successfully|spearheaded|exceeded|strategically|upscaled|negotiated|contributed|strong)\b/i;
  if (ROLE_KEYWORDS.test(clean) && !ACTION_START.test(clean) && clean.split(/\s+/).length <= 12) return true;
  return false;
};

/* ═══════════════════════════════════════════════════════════════════════════
   LaTeX CV Parser — detects and extracts structured data from LaTeX source
   ═══════════════════════════════════════════════════════════════════════════ */
const isLatexSource = (text) => /\\documentclass|\\begin\{document\}|\\resumeSubheading|\\resumeItem|\\section\{/.test(text);

const parseLatexCV = (text) => {
  const cv = emptyCVData();

  // ── Helper: strip LaTeX commands, keep text content ──
  const stripLatex = (s) => s
    .replace(/\\textbf\{([^}]*)\}/g, '$1')
    .replace(/\\textit\{([^}]*)\}/g, '$1')
    .replace(/\\emph\{([^}]*)\}/g, '$1')
    .replace(/\\underline\{([^}]*)\}/g, '$1')
    .replace(/\\small\b/g, '')
    .replace(/\\tiny\b/g, '')
    .replace(/\\large\b/g, '')
    .replace(/\\Large\b/g, '')
    .replace(/\\LARGE\b/g, '')
    .replace(/\\huge\b/g, '')
    .replace(/\\Huge\b/g, '')
    .replace(/\\scshape\b/g, '')
    .replace(/\\bfseries\b/g, '')
    .replace(/\\itshape\b/g, '')
    .replace(/\\normalsize\b/g, '')
    .replace(/\\raisebox\{[^}]*\}\\fa\w+\\/g, '')
    .replace(/\\raisebox\{[^}]*\}/g, '')
    .replace(/\\fa\w+\\/g, '')
    .replace(/\\fa\w+/g, '')
    .replace(/\\href\{[^}]*\}\{([^}]*)\}/g, '$1')
    .replace(/\\vspace\{[^}]*\}/g, '')
    .replace(/\\hspace\{[^}]*\}/g, '')
    .replace(/\\\\/g, '')
    .replace(/\\%/g, '%')
    .replace(/\\&/g, '&')
    .replace(/\$\|?\$/g, '|')
    .replace(/\$[^$]*\$/g, '')
    .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[{}]/g, '')
    .replace(/\s*~\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // ── Extract name from \begin{center} ... {\Huge ...} or first scshape ──
  const nameMatch = text.match(/\\(?:Huge|LARGE|Large)\s*(?:\\scshape\s*)?([^}\\]+)/);
  if (nameMatch) cv.personal.fullName = nameMatch[1].trim();

  // ── Extract contact info ──
  // First try: get the displayed email from \underline{} inside \href{mailto:...}
  const emailMatch = text.match(/\\href\{mailto:[^}]*\}\{[\s\S]*?\\underline\{([^}]*)\}\}/);
  if (emailMatch) {
    cv.personal.email = emailMatch[1].trim();
  }
  // Fallback: find ALL email addresses and pick the best one (skip placeholders like x@gmail.com)
  if (!cv.personal.email || cv.personal.email.length < 5) {
    const allEmails = [...text.matchAll(/[\w.+-]+@[\w.-]+\.\w{2,}/g)].map(m => m[0]);
    const realEmail = allEmails.find(e => e.length > 8 && !/^x@|^test@|^email@|^your/i.test(e));
    if (realEmail) cv.personal.email = realEmail;
  }

  const phoneMatch = text.match(/\\faPhone[\\s]*\s*([+\d\s()-]+)/);
  if (phoneMatch) cv.personal.phone = phoneMatch[1].trim();

  const linkedinMatch = text.match(/\\underline\{((?:linkedin\.com|www\.linkedin\.com)[^}]*)\}/i);
  if (linkedinMatch) cv.personal.linkedin = linkedinMatch[1].trim();

  const githubMatch = text.match(/\\underline\{((?:github\.com)[^}]*)\}/i);
  if (githubMatch) cv.personal.website = githubMatch[1].trim();

  // Location + Title — look in the \begin{center} block after the name
  const centerBlock = text.match(/\\begin\{center\}([\s\S]*?)\\end\{center\}/);
  if (centerBlock) {
    const centerText = centerBlock[1];
    // Title/description line — first non-command line after name
    const descLine = centerText.match(/\\vspace\{1pt\}\s*\n\s*([^\n\\{]+?)(?:\s*\\|\s*$)/m);
    if (descLine) {
      const desc = descLine[1].trim().replace(/\.\s*$/, '');
      // Split on period — first part is title/field, rest might be location
      const parts = desc.split(/\.\s*/);
      if (parts.length >= 2) {
        cv.personal.title = parts[0].trim();
        cv.personal.location = parts[1].replace(/Open to Relocate/i, '').trim().replace(/\.\s*$/, '');
      } else if (desc.length < 80) {
        cv.personal.title = desc;
      }
    }
  }

  // ── Extract summary from \begin{rSection} ──
  const summaryMatch = text.match(/\\begin\{rSection\}\{[^}]*\}\s*\n?\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/s);
  if (summaryMatch) cv.summary = stripLatex(summaryMatch[1]).trim();

  // ── Split into sections by \section{...} ──
  const sectionRegex = /\\section\{([^}]+)\}/g;
  const sectionPositions = [];
  let sm;
  while ((sm = sectionRegex.exec(text)) !== null) {
    sectionPositions.push({ name: sm[1].trim(), start: sm.index + sm[0].length });
  }

  for (let si = 0; si < sectionPositions.length; si++) {
    const sec = sectionPositions[si];
    const end = si + 1 < sectionPositions.length ? sectionPositions[si + 1].start : text.length;
    const content = text.slice(sec.start, end);
    const secName = sec.name.toLowerCase();

    // ── EDUCATION ──
    if (secName.includes('education')) {
      const eduRegex = /\\resumeSubheading\s*\n?\s*\{([^}]*)\}\{([^}]*)\}\s*\n?\s*\{([^}]*)\}\{([^}]*)\}/g;
      let em;
      while ((em = eduRegex.exec(content)) !== null) {
        cv.education.push({
          institution: stripLatex(em[1]).trim(),
          degree: stripLatex(em[3]).trim(),
          dates: stripLatex(em[2]).trim(),
          grade: '',
        });
      }
    }

    // ── RELEVANT MODULES / COURSEWORK ──
    else if (secName.includes('module') || secName.includes('coursework') || secName.includes('relevant')) {
      const itemRegex = /\\item\s*(?:\\small\s*)?([^\n\\]+)/g;
      let im;
      while ((im = itemRegex.exec(content)) !== null) {
        const skill = stripLatex(im[1]).trim();
        if (skill.length > 1) cv.skills.push(skill);
      }
    }

    // ── EXPERIENCE ──
    else if (secName.includes('experience')) {
      const subheadRegex = /\\resumeSubheading\s*\n?\s*\{([^}]*)\}\{([^}]*)\}\s*\n?\s*\{([^}]*)\}\{([^}]*)\}/g;
      let exm;
      // Collect all positions with their start indices
      const positions = [];
      while ((exm = subheadRegex.exec(content)) !== null) {
        positions.push({
          company: stripLatex(exm[1]).trim(),
          dates: stripLatex(exm[2]).trim(),
          role: stripLatex(exm[3]).trim(),
          location: stripLatex(exm[4]).trim(),
          startIdx: exm.index + exm[0].length,
        });
      }
      // Extract bullets for each position
      positions.forEach((pos, pi) => {
        const bulletEnd = pi + 1 < positions.length ? positions[pi + 1].startIdx - 100 : content.length;
        const bulletSection = content.slice(pos.startIdx, bulletEnd);
        const bullets = [];
        const bulletRegex = /\\resumeItem\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g;
        let bm;
        while ((bm = bulletRegex.exec(bulletSection)) !== null) {
          const bullet = stripLatex(bm[1]).trim();
          if (bullet.length > 5) bullets.push(bullet);
        }
        cv.experience.push({
          role: pos.role,
          company: pos.company,
          dates: pos.dates,
          location: pos.location,
          bullets,
        });
      });
    }

    // ── PROJECTS / RESEARCH ──
    else if (secName.includes('project') || secName.includes('research')) {
      const projRegex = /\\resumeProjectHeading\s*\n?\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}\{([^}]*)\}/g;
      let pm;
      const projects = [];
      while ((pm = projRegex.exec(content)) !== null) {
        const rawTitle = pm[1];
        // Extract project name and tech stack
        const titleParts = rawTitle.split(/\$\s*\|\s*\$/);
        const projectName = stripLatex(titleParts[0] || '').trim();
        const techStack = stripLatex(titleParts[1] || '').trim();
        projects.push({
          name: projectName,
          tech: techStack,
          dates: stripLatex(pm[2]).trim(),
          startIdx: pm.index + pm[0].length,
        });
      }
      projects.forEach((proj, pi) => {
        const bulletEnd = pi + 1 < projects.length ? projects[pi + 1].startIdx - 50 : content.length;
        const bulletSection = content.slice(proj.startIdx, bulletEnd);
        const bullets = [];
        const bulletRegex = /\\resumeItem\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g;
        let bm;
        while ((bm = bulletRegex.exec(bulletSection)) !== null) {
          const bullet = stripLatex(bm[1]).trim();
          if (bullet.length > 5) bullets.push(bullet);
        }
        cv.experience.push({
          role: proj.name + (proj.tech ? ' | ' + proj.tech : ''),
          company: 'Project',
          dates: proj.dates,
          location: '',
          bullets,
        });
      });
    }

    // ── SKILLS / TECHNICAL SKILLS ──
    else if (secName.includes('skill') || secName.includes('technical')) {
      // Parse \textbf{Category}{: values} patterns
      const skillLineRegex = /\\textbf\{([^}]*)\}\{:\s*([^}]*)\}/g;
      let skm;
      while ((skm = skillLineRegex.exec(content)) !== null) {
        const category = stripLatex(skm[1]).trim();
        const values = stripLatex(skm[2]).trim();
        values.split(/\s*,\s*/).forEach(v => {
          if (v.trim().length > 1) cv.skills.push(v.trim());
        });
      }
      // Fallback: parse \item entries
      if (cv.skills.length === 0) {
        const itemRegex = /\\item\s*(?:\\small\s*)?([^\n]+)/g;
        let im;
        while ((im = itemRegex.exec(content)) !== null) {
          const skill = stripLatex(im[1]).trim();
          if (skill.length > 1) cv.skills.push(skill);
        }
      }
    }

    // ── CERTIFICATIONS / LEADERSHIP / AWARDS / INVOLVEMENT ──
    else if (secName.includes('certif') || secName.includes('award') || secName.includes('leader') || secName.includes('involvement')) {
      // Check for resumeSubheading (structured format)
      const subheadMatch = content.match(/\\resumeSubheading\s*\n?\s*\{([^}]*)\}\{([^}]*)\}\s*\n?\s*\{([^}]*)\}\{([^}]*)\}/);
      if (subheadMatch) {
        const certTitle = stripLatex(subheadMatch[1]).trim();
        if (certTitle) cv.certifications.push(certTitle + (subheadMatch[2] ? ' (' + stripLatex(subheadMatch[2]).trim() + ')' : ''));
      }
      // Extract all resumeItems as certifications
      const certRegex = /\\resumeItem\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g;
      let cm;
      while ((cm = certRegex.exec(content)) !== null) {
        const cert = stripLatex(cm[1]).trim();
        if (cert.length > 5) cv.certifications.push(cert);
      }
    }
  }

  return cv;
};

const parseRawCVText = (text) => {
  // ── Detect LaTeX source and delegate to specialised parser ──
  if (isLatexSource(text)) return parseLatexCV(text);

  const cv = emptyCVData();
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  /* ─── PERSONAL INFO ─── */

  // Email (most reliable anchor for the header area)
  const emailMatch = text.match(/[\w.+-]+@[\w.-]+\.\w{2,}/);
  if (emailMatch) cv.personal.email = emailMatch[0];

  // Phone — international formats: +44 7911 123456, (555) 123-4567, 07911 123456, +1-555-123-4567
  const phoneMatch = text.match(/(?:\+?\d{1,4}[\s.-]?)?\(?\d{1,5}\)?[\s.-]?\d{2,5}[\s.-]?\d{2,5}(?:[\s.-]?\d{1,5})?/);
  if (phoneMatch) {
    const digits = phoneMatch[0].replace(/\D/g, '');
    if (digits.length >= 7 && digits.length <= 15) cv.personal.phone = phoneMatch[0].trim();
  }

  // LinkedIn
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/i);
  if (linkedinMatch) cv.personal.linkedin = linkedinMatch[0];

  // Website / GitHub / Portfolio
  const webMatch = text.match(/(?:https?:\/\/)?(?:www\.)?(?:github\.com|gitlab\.com|bitbucket\.org|behance\.net|dribbble\.com|portfolio\.\w+|[\w-]+\.(?:dev|io|me|com|co\.uk|org))\/[\w./-]*/i);
  if (webMatch && !/linkedin/i.test(webMatch[0])) cv.personal.website = webMatch[0];

  // Location — universal: "City, State/Country" pattern or "City, XX" (2-3 letter codes)
  // Also handles standalone well-known city names with optional country
  const locPatterns = [
    // "City, State" or "City, Country" (e.g., "San Francisco, CA", "London, UK", "Lagos, Nigeria")
    /\b([A-Z][a-zA-Z\s-]{1,30}),\s*([A-Z]{2,3}|[A-Z][a-zA-Z\s]{2,25})\b/,
    // City names followed by country identifiers
    /\b([A-Z][a-zA-Z\s-]{2,25})\s*,?\s*(?:United Kingdom|United States|USA|UK|Canada|Australia|India|Nigeria|Ghana|South Africa|Germany|France|Ireland|UAE|Singapore|Hong Kong|New Zealand|Netherlands|Sweden|Norway|Denmark|Switzerland|Belgium|Spain|Italy|Portugal|Brazil|Japan|China|Kenya|Egypt|Pakistan|Bangladesh|Malaysia|Philippines|Indonesia|Saudi Arabia|Qatar|Kuwait|Bahrain|Oman)\b/i,
  ];
  for (const lp of locPatterns) {
    const lm = text.match(lp);
    if (lm) { cv.personal.location = lm[0].trim(); break; }
  }

  // Name detection — improved strategy:
  // 1. Look in the first 5 lines for a line that is NOT email/phone/url/section header
  // 2. Must look like a proper name (2-4 capitalized words, possibly with accents/hyphens)
  const headerLines = lines.slice(0, Math.min(8, lines.length));
  const sectionKeywords = /^(education|experience|skills?|summary|objective|profile|about|work|employment|career|qualifications?|certifications?|awards?|achievements?|training|projects?|publications?)/i;
  const contactLine = /[@|•·]|linkedin\.com|github\.com|\+\d{2,}|\(\d{3}\)|\d{3}[\s.-]\d{3,4}/i;

  for (const hl of headerLines) {
    // Skip lines that are clearly contact info, URLs, or section headers
    if (contactLine.test(hl)) continue;
    if (sectionKeywords.test(hl)) continue;
    if (hl.length < 3 || hl.length > 50) continue;
    // Name heuristic: mostly letters (including Unicode), spaces, hyphens, apostrophes
    // Allow accented characters: é, ñ, ö, ü, etc.
    const cleaned = hl.replace(/[^a-zA-Z\u00C0-\u024F\u1E00-\u1EFF\s\-'.]/g, '').trim();
    const words = cleaned.split(/\s+/);
    if (words.length >= 2 && words.length <= 5 && cleaned.length > 3) {
      // Check most words are capitalized (or all-caps like "JOHN DOE")
      const isName = words.every(w => /^[A-Z\u00C0-\u024F]/.test(w) || /^[A-Z\u00C0-\u024F]+$/.test(w));
      if (isName) {
        // Title-case it if it's ALL CAPS
        cv.personal.fullName = words.map(w =>
          w === w.toUpperCase() && w.length > 1
            ? w.charAt(0) + w.slice(1).toLowerCase()
            : w
        ).join(' ');
        break;
      }
    }
  }

  // Professional title detection — look for common titles near the name in the header area
  const titlePatterns = /\b(software\s+engineer|software\s+developer|web\s+developer|full[\s-]?stack\s+developer|front[\s-]?end\s+developer|back[\s-]?end\s+developer|data\s+scientist|data\s+analyst|data\s+engineer|product\s+manager|project\s+manager|programme\s+manager|business\s+analyst|marketing\s+manager|marketing\s+specialist|digital\s+marketing|ux\s+designer|ui\s+designer|ux\/ui\s+designer|graphic\s+designer|devops\s+engineer|cloud\s+engineer|machine\s+learning\s+engineer|ai\s+engineer|cyber\s+security|security\s+analyst|network\s+engineer|systems?\s+administrator|database\s+administrator|qa\s+engineer|test\s+engineer|mobile\s+developer|ios\s+developer|android\s+developer|technical\s+lead|tech\s+lead|team\s+lead|engineering\s+manager|cto|ceo|cfo|coo|vp\s+of|director\s+of|head\s+of|senior\s+consultant|management\s+consultant|financial\s+analyst|accountant|hr\s+manager|recruiter|talent\s+acquisition|scrum\s+master|agile\s+coach|solutions?\s+architect|enterprise\s+architect|research\s+scientist|clinical\s+research|nurse|doctor|pharmacist|teacher|lecturer|professor|graduate\s+trainee|trainee\s+solicitor|paralegal|solicitor|barrister|quantity\s+surveyor|civil\s+engineer|mechanical\s+engineer|electrical\s+engineer|chemical\s+engineer)\b/i;

  for (const hl of headerLines) {
    if (contactLine.test(hl)) continue;
    if (hl === cv.personal.fullName) continue;
    const tm = hl.match(titlePatterns);
    if (tm) {
      cv.personal.title = hl.trim();
      break;
    }
  }

  /* ─── SECTION SPLITTING ─── */
  const sectionHeaders = [
    { key: 'summary', patterns: [
      /\b(professional\s+)?summary\b/i, /\b(personal\s+)?profile\b/i, /\b(career\s+)?objective\b/i,
      /\babout\s*me?\b/i, /\bpersonal\s+statement\b/i, /\bexecutive\s+summary\b/i,
      /\bcareer\s+summary\b/i, /\bprofessional\s+overview\b/i,
    ]},
    { key: 'experience', patterns: [
      /\b(work\s+)?experience\b/i, /\bwork\s+history\b/i, /\bemployment(\s+history)?\b/i,
      /\bcareer\s+history\b/i, /\bprofessional\s+experience\b/i, /\brelevant\s+experience\b/i,
      /\binternship(s)?\b/i, /\bplacements?\b/i, /\bwork\s+placements?\b/i,
    ]},
    { key: 'education', patterns: [
      /\beducation(\s+(&|and)\s+training)?\b/i, /\bacademic(\s+background)?\b/i,
      /\bqualifications?\b/i, /\beducation(\s+&)?\s+qualifications?\b/i,
      /\bacademic\s+qualifications?\b/i, /\beducational\s+background\b/i,
    ]},
    { key: 'skills', patterns: [
      /\b(technical\s+)?skills?\b/i, /\bcore\s+competenc/i, /\bkey\s+skills?\b/i,
      /\brelevant\s+(skills?|modules?)\b/i, /\btechnical\s+proficienc/i,
      /\btools?\s+(&|and)\s+technologies\b/i, /\btechnologies\b/i,
      /\bprogramming\s+languages?\b/i, /\bsoftware\s+(&|and)\s+tools?\b/i,
      /\bareas?\s+of\s+expertise\b/i, /\bproficiencies\b/i,
    ]},
    { key: 'certifications', patterns: [
      /\bcertification/i, /\blicen[sc]es?\s+(&|and)\s+certifications?\b/i,
      /\bawards?\s*(&|and)?\s*(honours?|honors?)?\b/i, /\bachievements?\b/i,
      /\bhonours?\b/i, /\bhonors?\b/i, /\bprofessional\s+development\b/i,
      /\btraining\s+(&|and)\s+certifications?\b/i, /\baccreditations?\b/i,
    ]},
    { key: 'projects', patterns: [
      /\b(personal\s+|academic\s+|key\s+)?projects?\b/i, /\bportfolio\b/i,
    ]},
    { key: '_ignore', patterns: [
      /\bhobbies?\b/i, /\binterests?\b/i, /\b(spoken\s+)?languages?\b/i,
      /\bvolunteer(ing)?\b/i, /\breferences?\b/i, /\badditional\s+information\b/i,
      /\bextracurricular/i, /\bpersonal\s+interests?\b/i,
      /\bactivities\b/i, /\bmemberships?\b/i, /\baffiliations?\b/i,
    ]},
  ];

  const sections = [];
  lines.forEach((line, idx) => {
    // Section headers tend to be short, possibly ALL CAPS or Title Case, and stand alone
    if (line.length > 70) return;
    const lineClean = line.replace(/^[─═\-_*#]+\s*/, '').replace(/\s*[─═\-_*#]+$/, '').trim();
    if (!lineClean) return;
    for (const sec of sectionHeaders) {
      if (sec.patterns.some(p => p.test(lineClean))) {
        // Avoid matching "skills" inside a bullet like "Developed leadership skills"
        const isStandalone = lineClean.length < 50 &&
          !(/^[•\-*▪◦→]/.test(line)) &&
          (lineClean.split(/\s+/).length <= 6);
        if (isStandalone) {
          sections.push({ key: sec.key, start: idx + 1 });
          break;
        }
      }
    }
  });

  sections.forEach((sec, i) => {
    if (sec.key === '_ignore') return;
    const end = i + 1 < sections.length ? sections[i + 1].start - 1 : lines.length;
    const content = lines.slice(sec.start, end);

    /* ─── SUMMARY ─── */
    if (sec.key === 'summary') {
      cv.summary = content.join(' ').replace(/\s+/g, ' ').trim();
    }

    /* ─── EXPERIENCE ─── */
    if (sec.key === 'experience') {
      const entries = [];
      let headerLines = [];

      content.forEach((line) => {
        // Skip noise sub-headers
        if (SUBHEADER_NOISE.test(line)) return;

        const dm = matchDateRange(line);
        if (dm) {
          const entry = { role: '', company: '', dates: dm[0].trim(), location: '', bullets: [] };
          const beforeDate = line.replace(dm[0], '').replace(/[,|–—-]\s*$/, '').replace(/^\s*[,|–—-]\s*/, '').trim();

          if (headerLines.length > 0) {
            // Determine which header line is role vs company
            if (headerLines.length === 1) {
              // Single header — could be "Role at Company" or "Role, Company" or just "Role"
              const parts = headerLines[0].split(/\s+(?:at|@)\s+|(?:\s*[,|]\s*)/i);
              if (parts.length >= 2 && COMPANY_INDICATORS.test(parts[parts.length - 1])) {
                entry.role = parts.slice(0, -1).join(', ').trim();
                entry.company = parts[parts.length - 1].trim();
              } else {
                entry.role = headerLines[0];
              }
            } else {
              // Multiple header lines — first is typically role, second is company
              entry.role = headerLines[0];
              const companyLine = headerLines[1];
              // Check if second line has location pattern
              const locM = companyLine.match(LOCATION_PATTERN);
              if (locM) {
                entry.company = companyLine.replace(locM[0], '').replace(/[,|]\s*$/, '').trim();
                entry.location = locM[0];
              } else {
                entry.company = companyLine;
              }
              // If there's a 3rd header line, it might be location
              if (headerLines.length >= 3) {
                const thirdLine = headerLines[2];
                if (LOCATION_PATTERN.test(thirdLine) && !entry.location) {
                  entry.location = thirdLine;
                }
              }
            }
            headerLines = [];
          } else if (beforeDate) {
            // Text on same line as date
            const parts = beforeDate.split(/\s+(?:at|@)\s+|(?:\s*[,|]\s*)/i);
            if (parts.length >= 2 && COMPANY_INDICATORS.test(parts[parts.length - 1])) {
              entry.role = parts.slice(0, -1).join(', ').trim();
              entry.company = parts[parts.length - 1].trim();
            } else {
              entry.role = beforeDate;
            }
          }

          entries.push(entry);
        } else if (entries.length > 0) {
          const last = entries[entries.length - 1];
          const clean = line.replace(/^[•\-*▪◦→⋅●○■□✓✔]\s*/, '').trim();

          // Skip sub-header noise lines inside experience entries
          if (SUBHEADER_NOISE.test(clean)) return;

          // ── NEW: detect "Role | Company" or role-keyword headers mid-stream ──
          if (isRoleHeader(clean)) {
            // Create a new entry inheriting the previous dates if none provided
            const newEntry = { role: '', company: '', dates: '', location: '', bullets: [] };
            // Parse "Role | Company" or "Role at Company"
            if (/\|/.test(clean)) {
              const parts = clean.split(/\s*\|\s*/);
              newEntry.role = parts[0].trim();
              newEntry.company = parts.slice(1).join(' | ').trim();
            } else if (/\s+(?:at|@)\s+/i.test(clean)) {
              const parts = clean.split(/\s+(?:at|@)\s+/i);
              newEntry.role = parts[0].trim();
              newEntry.company = parts.slice(1).join(' ').trim();
            } else {
              newEntry.role = clean;
            }
            entries.push(newEntry);
            return;
          }

          const isBulletLine = /^[•\-*▪◦→⋅●○■□✓✔]/.test(line);
          const isShortMeta = clean.length > 2 && clean.length < 60 && !isBulletLine;
          const hasCompanyWord = COMPANY_INDICATORS.test(clean);
          const hasLocationPattern = LOCATION_PATTERN.test(clean);

          // Explicit bullet lines are always bullets
          if (isBulletLine && clean.length > 5) {
            // Merge short fragments with previous bullet (PDF line-wrap artifacts)
            if (clean.length < 30 && /^[a-z]/.test(clean) && last.bullets.length > 0) {
              last.bullets[last.bullets.length - 1] += ' ' + clean;
            } else {
              last.bullets.push(clean);
            }
          // Short lines that look like company/location metadata (not bullet-prefixed)
          } else if (isShortMeta && (hasCompanyWord || hasLocationPattern || !last.company)) {
            if (hasCompanyWord) {
              last.company = last.company ? last.company + ' ' + clean : clean;
            } else if (hasLocationPattern && !last.location) {
              last.location = clean;
            } else if (!last.company) {
              last.company = clean;
            } else if (!last.location && clean.length < 40 && /^[A-Z]/.test(clean)) {
              last.location = clean;
            } else if (clean.length > 15) {
              last.bullets.push(clean);
            }
          // Longer non-bullet lines — only add as bullets if they look like real content
          } else if (clean.length > 15) {
            // Merge short fragments that start with lowercase (PDF line-wrap artifacts)
            if (clean.length < 40 && /^[a-z]/.test(clean) && last.bullets.length > 0) {
              last.bullets[last.bullets.length - 1] += ' ' + clean;
            } else {
              last.bullets.push(clean);
            }
          }
        } else {
          // Lines before first date — accumulate as header
          if (line.length < 80 && line.length > 2) headerLines.push(line);
        }
      });

      // Fallback: if no date-anchored entries, try grouping by role-like keywords
      if (entries.length === 0 && content.length > 0) {
        const roleKeywords = /\b(manager|engineer|developer|analyst|designer|consultant|intern|trainee|coordinator|specialist|administrator|officer|assistant|associate|director|lead|head|supervisor|executive)\b/i;
        let currentEntry = null;
        content.forEach(line => {
          if (SUBHEADER_NOISE.test(line)) return;
          const clean = line.replace(/^[•\-*▪◦→⋅●○■□✓✔]\s*/, '').trim();
          if (roleKeywords.test(line) && line.length < 60 && !/^[•\-*▪◦→]/.test(line)) {
            if (currentEntry && (currentEntry.role || currentEntry.bullets.length > 0)) entries.push(currentEntry);
            currentEntry = { role: clean, company: '', dates: '', location: '', bullets: [] };
          } else if (currentEntry) {
            // Check for company/location metadata before treating as bullet
            if (!currentEntry.company && COMPANY_INDICATORS.test(clean) && clean.length < 60) {
              currentEntry.company = clean;
            } else if (!currentEntry.location && LOCATION_PATTERN.test(clean) && clean.length < 60) {
              currentEntry.location = clean;
            } else if (!currentEntry.company && clean.length < 50 && clean.length > 2 && !/^[•\-*▪◦→]/.test(line)) {
              currentEntry.company = clean;
            } else if (clean.length > 15) {
              currentEntry.bullets.push(clean);
            }
          } else {
            currentEntry = { role: clean, company: '', dates: '', location: '', bullets: [] };
          }
        });
        if (currentEntry && (currentEntry.role || currentEntry.bullets.length > 0)) entries.push(currentEntry);
      }

      // Post-process 1: clean bullets that look like company/location metadata
      entries.forEach(entry => {
        entry.bullets = entry.bullets.filter(b => {
          const t = b.trim();
          if (t.length < 12 && !t.includes(' ')) return false;
          if (t.length < 40 && COMPANY_INDICATORS.test(t) && !/\b(managed|led|developed|created|built|designed|implemented|delivered|achieved|improved|increased|reduced|coordinated|organized)\b/i.test(t)) return false;
          if (t.length < 40 && LOCATION_PATTERN.test(t) && t.split(/\s+/).length <= 4) return false;
          return true;
        });
      });
      // Post-process 2: merge short sentence fragments with previous bullet
      // These are PDF line-wrap artifacts like ", achieving 1st in London..." or "England and 3rd in the UK."
      entries.forEach(entry => {
        const merged = [];
        entry.bullets.forEach(b => {
          const t = b.trim();
          const isFragment = (
            (t.length < 60 && /^[,;a-z]/.test(t)) ||  // starts with lowercase or comma
            (t.length < 40 && !/^[A-Z]/.test(t)) ||     // very short, doesn't start with capital
            (t.length < 50 && /^(and|or|but|the|in|to|for|by|with|from)\s/i.test(t) && !/\b(managed|led|developed|created|built|designed|implemented|delivered|achieved|improved|increased|reduced|coordinated|organized|assessed|conducted|executed|provided|applied|forged|spearheaded|exceeded|strategically|upscaled|negotiated|contributed|streamlined|communicated|safeguarded|addressed)\b/i.test(t))
          );
          if (isFragment && merged.length > 0) {
            // Merge with previous bullet
            const separator = /^[,;]/.test(t) ? '' : ' ';
            merged[merged.length - 1] = merged[merged.length - 1] + separator + t;
          } else {
            merged.push(t);
          }
        });
        entry.bullets = merged;
      });
      cv.experience = entries;
    }

    /* ─── EDUCATION ─── */
    if (sec.key === 'education') {
      const entries = [];
      let headerLines = [];

      const isInstitution = (line) => /university|college|school|institute|academy|polytechnic|conservat/i.test(line);
      const hasDegree = (line) => /bachelor|master|msc|bsc|ba\b|ma\b|mba\b|phd|ph\.d|doctorate|diploma|btec|a[\s-]?level|gcse|hnd|hnc|b\.?tech|m\.?tech|b\.?eng|m\.?eng|b\.?sc|m\.?sc|b\.?a\b|m\.?a\b|ll\.?b|ll\.?m|pgce|pgdip|postgraduate|undergraduate|associate('s)?\s+degree|high\s+school\s+diploma|advanced\s+diploma|foundation\s+degree|certificate|nvq|gnvq|ibaccalaureate|engineering|computer\s+science|medicine|law\s+degree/i.test(line);
      const hasGrade = (line) => /first(\s+class)?|upper\s+second|lower\s+second|2[:.]?1|2[:.]?2|1st|third|distinction|merit|pass|grade|gpa|cum\s+laude|magna|summa|honours?|honors?|cgpa/i.test(line);

      content.forEach(line => {
        const dm = matchDateRange(line);

        if (dm) {
          const dateStr = dm[0].trim();
          const beforeDate = line.replace(dm[0], '').replace(/[,|–—-]\s*$/, '').replace(/^\s*[,|–—-]\s*/, '').trim();
          const entry = { institution: '', degree: '', dates: dateStr, grade: '' };

          // Use accumulated header lines
          headerLines.forEach(hl => {
            if (isInstitution(hl)) entry.institution = entry.institution || hl;
            else if (hasDegree(hl)) entry.degree = entry.degree || hl;
            else if (hasGrade(hl)) entry.grade = entry.grade || hl;
            else if (!entry.institution && !entry.degree) entry.institution = hl; // Default first unknown to institution
          });
          if (beforeDate) {
            if (isInstitution(beforeDate) && !entry.institution) entry.institution = beforeDate;
            else if (hasDegree(beforeDate) && !entry.degree) entry.degree = beforeDate;
            else if (!entry.institution) entry.institution = beforeDate;
            else if (!entry.degree) entry.degree = beforeDate;
          }
          headerLines = [];
          entries.push(entry);
        } else if (entries.length > 0) {
          const last = entries[entries.length - 1];
          if (isInstitution(line) && !last.institution) last.institution = line;
          else if (hasDegree(line) && !last.degree) last.degree = line;
          else if (hasGrade(line)) last.grade = last.grade ? `${last.grade}, ${line}` : line;
          // Check for standalone year that might be a graduation year
          else if (!last.dates && STANDALONE_YEAR.test(line) && line.length < 15) last.dates = line;
        } else {
          headerLines.push(line);
        }
      });

      // Fallback: no date-anchored entries — group by institution/degree keywords
      if (entries.length === 0 && content.length > 0) {
        let currentEntry = null;
        content.forEach(line => {
          if (isInstitution(line) || (hasDegree(line) && !currentEntry)) {
            if (currentEntry && (currentEntry.institution || currentEntry.degree)) entries.push(currentEntry);
            currentEntry = { institution: '', degree: '', dates: '', grade: '' };
            if (isInstitution(line)) currentEntry.institution = line;
            else currentEntry.degree = line;
          } else if (currentEntry) {
            if (hasDegree(line) && !currentEntry.degree) currentEntry.degree = line;
            else if (isInstitution(line) && !currentEntry.institution) currentEntry.institution = line;
            else if (hasGrade(line)) currentEntry.grade = line;
            else if (STANDALONE_YEAR.test(line) && !currentEntry.dates && line.length < 15) currentEntry.dates = line;
          }
        });
        if (currentEntry && (currentEntry.institution || currentEntry.degree)) entries.push(currentEntry);
      }

      // Deduplicate by institution+degree combo
      const seen = new Set();
      cv.education = entries.filter(e => {
        const key = `${(e.institution || '').toLowerCase().trim()}|${(e.degree || '').toLowerCase().trim()}`;
        if (key === '|') return false; // Skip completely empty entries
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    /* ─── SKILLS ─── */
    if (sec.key === 'skills') {
      content.forEach(line => {
        const clean = line.replace(/^[•\-*▪◦→⋅●○■□✓✔]\s*/, '').trim();
        if (!clean || clean.length < 2) return;

        // Handle "Category: Skill1, Skill2, Skill3" format
        const categoryMatch = clean.match(/^([^:]{3,30}):\s*(.+)/);
        if (categoryMatch) {
          const items = categoryMatch[2].split(/[,;•|▪◦]/).map(s => s.trim()).filter(s => s.length > 1 && s.length < 50);
          cv.skills.push(...items);
          return;
        }

        // Try splitting on commas/semicolons/bullets/pipes
        const items = clean.split(/[,;•|▪◦⋅●]/).map(s => s.trim()).filter(s => s.length > 1 && s.length < 50);

        if (items.length >= 2) {
          // Check average length — short items = skill list, long items = sentence fragments
          const avgLen = items.reduce((sum, s) => sum + s.length, 0) / items.length;
          if (avgLen < 25) {
            cv.skills.push(...items);
          } else {
            // Long average → probably a description sentence. Keep whole if short enough.
            if (clean.length < 55) cv.skills.push(clean);
          }
        } else if (items.length === 1) {
          const item = items[0];
          // Only add if it looks like a skill (not a full sentence)
          if (item.length < 55 && item.split(/\s+/).length <= 7) {
            cv.skills.push(item);
          }
        }
      });

      // Deduplicate (case-insensitive) and filter noise
      const skillSet = new Map();
      cv.skills.forEach(s => {
        const trimmed = s.replace(/^(and|or)\s+/i, '').replace(/\s+(and|or)$/i, '').trim();
        const key = trimmed.toLowerCase();
        if (!skillSet.has(key) && key.length > 1 && key.length < 55 &&
            !/^(and|or|the|etc|also|including|such\s+as|e\.g|with|for|in|of|to|a|an)$/i.test(key)) {
          skillSet.set(key, trimmed);
        }
      });
      cv.skills = [...skillSet.values()];
    }

    /* ─── CERTIFICATIONS ─── */
    if (sec.key === 'certifications') {
      let stopped = false;
      content.forEach(line => {
        const clean = line.replace(/^[•\-*▪◦→⋅●○■□✓✔]\s*/, '').trim();
        // Stop parsing if we hit a different sub-section
        if (/^(hobbies|interests|languages|volunteer|references|additional\s+information|extracurricular|activities|memberships?)/i.test(clean)) {
          stopped = true;
        }
        if (!stopped && clean.length > 3 && !SUBHEADER_NOISE.test(clean)) {
          cv.certifications.push(clean);
        }
      });
    }

    /* ─── PROJECTS (map to experience as additional entries) ─── */
    if (sec.key === 'projects') {
      const entries = [];
      let currentEntry = null;
      content.forEach(line => {
        if (SUBHEADER_NOISE.test(line)) return;
        const clean = line.replace(/^[•\-*▪◦→⋅●○■□✓✔]\s*/, '').trim();
        const dm = matchDateRange(line);
        const isBullet = /^[•\-*▪◦→⋅●○■□✓✔]/.test(line);

        if (dm || (!isBullet && clean.length > 3 && clean.length < 70 && !currentEntry)) {
          if (currentEntry && (currentEntry.role || currentEntry.bullets.length > 0)) entries.push(currentEntry);
          currentEntry = {
            role: dm ? line.replace(dm[0], '').replace(/[,|–—-]\s*$/, '').trim() : clean,
            company: 'Project',
            dates: dm ? dm[0].trim() : '',
            location: '',
            bullets: [],
          };
        } else if (currentEntry) {
          if (clean.length > 5) currentEntry.bullets.push(clean);
        }
      });
      if (currentEntry && (currentEntry.role || currentEntry.bullets.length > 0)) entries.push(currentEntry);
      // Append projects to experience
      cv.experience.push(...entries);
    }
  });

  /* ─── Professional title fallback — derive from first experience role ─── */
  if (!cv.personal.title && cv.experience.length > 0) {
    const firstRole = cv.experience[0].role;
    if (firstRole && firstRole.length < 50 && !/[:,]/.test(firstRole) && !COMPANY_INDICATORS.test(firstRole)) {
      cv.personal.title = firstRole;
    }
  }

  /* ─── If no location found via patterns, try to extract from contact line area ─── */
  if (!cv.personal.location) {
    // Look for location in the header area (first 8 lines) — often "City, State" separated by pipes/bullets
    for (const hl of headerLines.slice(0, 8)) {
      if (!contactLine.test(hl)) continue;
      const parts = hl.split(/[|•·]/);
      for (const part of parts) {
        const trimmed = part.trim();
        if (LOCATION_PATTERN.test(trimmed) && !/@/.test(trimmed) && !/linkedin|github/i.test(trimmed)) {
          cv.personal.location = trimmed;
          break;
        }
      }
      if (cv.personal.location) break;
    }
  }

  return cv;
};


/* ═══════════════════════════════════════════════════════════════════════════
   FILE EXTRACTION (PDF / DOCX)
   ═══════════════════════════════════════════════════════════════════════════ */

const extractTextFromFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    if (file.type === 'application/pdf') {
      reader.onload = async (e) => {
        try {
          if (window.pdfjsLib) {
            const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(e.target.result) }).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const tc = await page.getTextContent();
              // Group items by Y position to reconstruct lines properly
              let lastY = null;
              tc.items.forEach(item => {
                if (item.str.trim() === '') { fullText += ' '; return; }
                const y = Math.round(item.transform[5]);
                if (lastY !== null && Math.abs(y - lastY) > 3) fullText += '\n';
                else if (lastY !== null) fullText += ' ';
                fullText += item.str;
                lastY = y;
              });
              fullText += '\n\n';
            }
            resolve(fullText);
          } else {
            const text = new TextDecoder('utf-8').decode(new Uint8Array(e.target.result));
            resolve((text.match(/[\x20-\x7E]{4,}/g) || []).join('\n'));
          }
        } catch (_) {
          reject(new Error('Could not parse PDF. Try uploading a DOCX file instead.'));
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = async (e) => {
        try {
          const zip = await window.JSZip.loadAsync(e.target.result);
          const docXml = await zip.file('word/document.xml')?.async('string');
          if (docXml) {
            resolve(docXml
              .replace(/<w:p[^>]*>/g, '\n').replace(/<[^>]+>/g, '')
              .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
              .replace(/\n\s*\n/g, '\n'));
          } else reject(new Error('Could not read DOCX content.'));
        } catch (_) {
          reject(new Error('Could not parse DOCX file.'));
        }
      };
      reader.readAsArrayBuffer(file);
    }
  });
};


/* ═══════════════════════════════════════════════════════════════════════════
   JOB DESCRIPTION ANALYSIS ENGINE
   ─────────────────────────────────────────────────────────────────────────
   Heuristic-based keyword extraction, gap analysis, and suggestion generation.
   Designed to work entirely client-side (no API needed).
   ═══════════════════════════════════════════════════════════════════════════ */

// ── Common tech skills & tools dictionary for better matching ──
const TECH_SKILLS_DICT = new Set([
  'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'ruby', 'go', 'golang', 'rust', 'swift',
  'kotlin', 'php', 'scala', 'r', 'matlab', 'sql', 'nosql', 'html', 'css', 'sass', 'less',
  'react', 'angular', 'vue', 'svelte', 'next.js', 'nuxt', 'express', 'node.js', 'django', 'flask',
  'spring', 'rails', 'laravel', '.net', 'asp.net', 'fastapi', 'graphql', 'rest', 'restful',
  'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins',
  'ci/cd', 'git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence', 'slack', 'trello',
  'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'dynamodb', 'firebase', 'supabase',
  'figma', 'sketch', 'adobe', 'photoshop', 'illustrator', 'xd', 'invision',
  'agile', 'scrum', 'kanban', 'devops', 'microservices', 'serverless', 'api', 'sdk',
  'machine learning', 'deep learning', 'nlp', 'computer vision', 'tensorflow', 'pytorch', 'pandas',
  'numpy', 'tableau', 'power bi', 'excel', 'sap', 'salesforce', 'hubspot',
  'linux', 'unix', 'windows server', 'nginx', 'apache', 'cloudflare',
]);

const extractKeywordsFromJD = (text) => {
  if (!text || text.trim().length < 20) return [];
  const keywords = new Map(); // keyword → score

  const addKw = (kw, score = 1) => {
    const clean = kw.trim().replace(/[.,;:!?()[\]{}'"]+$/, '').replace(/^[.,;:!?()[\]{}'"]+/, '').trim();
    if (clean.length < 2 || clean.length > 50) return;
    const key = clean.toLowerCase();
    // Skip noise words
    if (/^(the|and|or|a|an|to|in|of|for|with|on|at|by|as|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|could|should|may|might|must|shall|can|need|this|that|these|those|it|its|you|your|we|our|they|their|etc|including|such|also|well|e\.g|i\.e|per|via)$/i.test(key)) return;
    keywords.set(key, (keywords.get(key) || 0) + score);
  };

  // 1. Match known tech skills (highest priority)
  const textLower = text.toLowerCase();
  TECH_SKILLS_DICT.forEach(skill => {
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    if (regex.test(textLower)) addKw(skill, 5);
  });

  // 2. Extract from "Requirements" / "Qualifications" / "Skills" sections
  const reqSections = text.match(/(?:requirements?|qualifications?|skills?|what\s+you.+?need|what\s+we.+?looking|must\s+have|nice\s+to\s+have|preferred|essential)[:\s]*\n?([\s\S]*?)(?=\n\s*\n|\n[A-Z][a-z]+:|\n(?:about|responsibilities|duties|benefits|salary|how\s+to)|$)/gi);
  if (reqSections) {
    reqSections.forEach(section => {
      // Extract individual list items
      const items = section.split(/\n/).map(l => l.replace(/^[\s•\-*▪◦→\d.)]+/, '').trim()).filter(l => l.length > 5 && l.length < 120);
      items.forEach(item => {
        // Extract short skill phrases (1-3 words)
        const words = item.split(/\s+/);
        if (words.length <= 4) { addKw(item, 3); }
        else {
          // Extract key multi-word phrases
          const phrases = item.match(/\b[A-Z][a-zA-Z0-9+#.-]*(?:\s+[A-Z][a-zA-Z0-9+#.-]*){0,2}\b/g);
          if (phrases) phrases.forEach(p => addKw(p, 2));
        }
      });
    });
  }

  // 3. Extract "X years of Y" patterns
  const yearsPattern = /(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:experience\s+(?:in|with)\s+)?([A-Za-z0-9#+.\s-]{2,30})/gi;
  let match;
  while ((match = yearsPattern.exec(text)) !== null) {
    addKw(match[2], 4);
  }

  // 4. Extract "proficient/experienced/skilled in X" patterns
  const profPattern = /(?:proficient|experienced|skilled|expertise|knowledge|familiar|fluent)\s+(?:in|with)\s+([A-Za-z0-9#+.,\s/-]{3,60})/gi;
  while ((match = profPattern.exec(text)) !== null) {
    const items = match[1].split(/[,;]|(?:\s+and\s+)/).map(s => s.trim()).filter(s => s.length > 1);
    items.forEach(item => addKw(item, 3));
  }

  // 5. Extract capitalized multi-word terms (proper nouns / technologies)
  const properNouns = text.match(/\b[A-Z][a-zA-Z0-9+#.-]+(?:\s+[A-Z][a-zA-Z0-9+#.-]+){0,2}\b/g);
  if (properNouns) {
    properNouns.forEach(term => {
      if (!/^(The|And|Our|We|You|Your|Must|Will|Have|Should|This|That|What|How|Where|When|About|With|From|Into)$/.test(term.split(/\s/)[0])) {
        addKw(term, 1);
      }
    });
  }

  // 6. Extract after colons (e.g., "Tech Stack: React, Node.js, AWS")
  const colonPattern = /(?:tech(?:nology|nical)?|stack|tools?|platforms?|frameworks?|languages?)[\s]*:[\s]*([^\n.]+)/gi;
  while ((match = colonPattern.exec(text)) !== null) {
    const items = match[1].split(/[,;/]|(?:\s+and\s+)/).map(s => s.trim()).filter(s => s.length > 1);
    items.forEach(item => addKw(item, 4));
  }

  // Sort by score, return top keywords
  return Array.from(keywords.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([kw]) => kw);
};

const analyzeGaps = (cvData, jdKeywords) => {
  if (!cvData || !jdKeywords.length) return null;

  const cvText = cvDataToText(cvData).toLowerCase();
  const cvSkillsLower = (cvData.skills || []).map(s => s.toLowerCase());

  const matched = [];
  const missing = [];

  jdKeywords.forEach(kw => {
    const kwLower = kw.toLowerCase();
    const found = cvText.includes(kwLower) || cvSkillsLower.some(s => s.includes(kwLower) || kwLower.includes(s));
    if (found) matched.push(kw);
    else missing.push(kw);
  });

  // Categorize missing keywords
  const missingSkills = missing.filter(kw => {
    const kwl = kw.toLowerCase();
    return TECH_SKILLS_DICT.has(kwl) || kwl.length < 20;
  });

  const missingExperience = missing.filter(kw => {
    const kwl = kw.toLowerCase();
    return /lead|manage|develop|design|architect|mentor|stakeholder|collaborate|deliver|deploy|build|implement|optimize|analyse|analyze|strategy|budget|planning|communicate/i.test(kwl);
  });

  const matchPct = jdKeywords.length > 0 ? Math.round((matched.length / jdKeywords.length) * 100) : 0;

  return {
    matchPercentage: matchPct,
    matchedKeywords: matched,
    missingSkills: missingSkills.slice(0, 12),
    missingExperience: missingExperience.slice(0, 6),
    allMissing: missing,
    totalKeywords: jdKeywords.length,
  };
};

const generateSuggestions = (cvData, jdKeywords, gaps) => {
  if (!cvData || !gaps) return {};

  const topMissing = gaps.missingSkills.slice(0, 3).map(s =>
    s.charAt(0).toUpperCase() + s.slice(1)
  );
  const topMatched = gaps.matchedKeywords.slice(0, 2).map(s =>
    s.charAt(0).toUpperCase() + s.slice(1)
  );

  // Summary suggestion
  let summaryHint = '';
  if (topMissing.length > 0) {
    const existing = cvData.summary || '';
    const nameOrRole = cvData.personal.title || cvData.personal.fullName || 'Professional';
    if (existing) {
      summaryHint = `${existing} Skilled in ${topMissing.join(', ')}${topMatched.length ? ` with proven expertise in ${topMatched.join(' and ')}` : ''}.`;
    } else {
      summaryHint = `Results-driven ${nameOrRole} with experience in ${topMissing.join(', ')}${topMatched.length ? ` and ${topMatched.join(', ')}` : ''}. Passionate about delivering high-quality solutions and collaborating with cross-functional teams.`;
    }
  }

  // Bullet suggestions for each experience entry
  const bulletSuggestions = {};
  if (cvData.experience.length > 0 && topMissing.length > 0) {
    cvData.experience.forEach((exp, idx) => {
      const relevantMissing = topMissing.filter(kw =>
        !exp.bullets.some(b => b.toLowerCase().includes(kw.toLowerCase()))
      );
      if (relevantMissing.length > 0) {
        bulletSuggestions[idx] = `Utilised ${relevantMissing.join(' and ')} to deliver impactful results, improving efficiency and stakeholder satisfaction.`;
      }
    });
  }

  // Recommended skills to add
  const skillsToAdd = gaps.missingSkills
    .filter(s => !(cvData.skills || []).some(cs => cs.toLowerCase() === s.toLowerCase()))
    .slice(0, 8)
    .map(s => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));

  // Advice items
  const advice = [];
  if (gaps.matchPercentage < 40) {
    advice.push('Your CV matches less than 40% of the job keywords. Consider adding more relevant skills and tailoring your bullet points.');
  }
  if (gaps.missingSkills.length > 5) {
    advice.push(`${gaps.missingSkills.length} key skills from the JD are missing from your CV. Add the most relevant ones to your Skills section.`);
  }
  if (!cvData.summary || cvData.summary.length < 50) {
    advice.push('Add a professional summary that includes keywords from the job description to improve ATS scanning.');
  }
  if (cvData.experience.length > 0) {
    const avgBullets = cvData.experience.reduce((sum, e) => sum + e.bullets.length, 0) / cvData.experience.length;
    if (avgBullets < 2) {
      advice.push('Add more bullet points to your experience entries. Aim for 3-5 per role, using action verbs and quantified achievements.');
    }
  }
  if (gaps.matchPercentage >= 70) {
    advice.push('Great match! Your CV aligns well with this role. Fine-tune the wording to mirror the exact phrases used in the job description.');
  }

  return { summary: summaryHint, bulletSuggestions, skillsToAdd, advice };
};

// ── Highlighted JD text component ──
const HighlightedJDText = ({ text, keywords }) => {
  if (!text) return null;
  if (!keywords || keywords.length === 0) return <span className="whitespace-pre-wrap text-[11px] leading-relaxed" style={{ color: '#333' }}>{text}</span>;

  // Build regex from keywords (escape special chars, match whole words)
  const escaped = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
  const parts = text.split(pattern);

  return (
    <span className="whitespace-pre-wrap text-[11px] leading-relaxed" style={{ color: '#333' }}>
      {parts.map((part, i) => {
        const isKeyword = keywords.some(k => k.toLowerCase() === part.toLowerCase());
        return isKeyword
          ? <mark key={i} style={{ background: '#fef08a', fontWeight: 600, borderRadius: '2px', padding: '0 2px' }}>{part}</mark>
          : <span key={i}>{part}</span>;
      })}
    </span>
  );
};


/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

const ATSCVBuilder = () => {
  const { currentUser, userProfile } = useAuth();
  const { showSuccess, showError } = useToast();
  const fileInputRef = useRef(null);
  const contentMeasureRef = useRef(null);

  const [cvData, setCvData] = useState(null);
  const [cvLoading, setCvLoading] = useState(true); // true while checking Firestore for saved CV
  const [savedCvDraft, setSavedCvDraft] = useState(null); // holds Firestore-loaded CV until user chooses to resume
  const [rawText, setRawText] = useState('');       // raw text for code editor
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');

  // Editor mode: 'code' or 'visual' (like Overleaf)
  const [editorMode, setEditorMode] = useState('visual');

  // Visual editor sections
  const [expandedSections, setExpandedSections] = useState(
    new Set(['personal', 'summary', 'experience', 'education', 'skills', 'certifications'])
  );

  // Inline preview editing
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');

  // Preview state
  const [pageCount, setPageCount] = useState(1);
  const [contentHeight, setContentHeight] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [mobileTab, setMobileTab] = useState('editor');
  const [pageMode, setPageMode] = useState('auto'); // 'auto' | '1' | '2'
  const [page2Sections, setPage2Sections] = useState(null); // { expStart, showEdu, showSkills, showCerts }

  // ── Job Description analysis state ──
  const [jobDescription, setJobDescription] = useState('');
  const [jdExpanded, setJdExpanded] = useState(true);
  const [jdAnalyzing, setJdAnalyzing] = useState(false);
  const [jdAnalysis, setJdAnalysis] = useState(null);       // { matchPercentage, matchedKeywords, missingSkills, ... }
  const [highlightedKeywords, setHighlightedKeywords] = useState([]);
  const [jdSuggestions, setJdSuggestions] = useState(null);  // { summary, bulletSuggestions, skillsToAdd, advice }
  const [showJdHighlighted, setShowJdHighlighted] = useState(false);

  // ── Two-way Profile ↔ CV sync ──
  const profileSyncedRef = useRef(false);

  // Load CV data from Firestore on first mount (restores full CV, merges profile data)
  useEffect(() => {
    if (cvData || profileSyncedRef.current) { setCvLoading(false); return; }
    if (!currentUser?.uid) { setCvLoading(false); return; }
    profileSyncedRef.current = true;

    const loadProfileIntoCv = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (!userDoc.exists()) { setCvLoading(false); return; }
        const data = userDoc.data();
        const cvSync = data.cvSyncData;
        const pd = data.profileData;
        if (!cvSync && !pd) { setCvLoading(false); return; }

        const cv = emptyCVData();

        // ── Personal info: prefer saved cvSyncData.personal, fall back to profile ──
        const savedPersonal = cvSync?.personal || {};
        const profileName = data.profile?.fullName || [data.profile?.firstName, data.profile?.lastName].filter(Boolean).join(' ') || '';
        cv.personal.fullName = savedPersonal.fullName || profileName;
        cv.personal.title    = savedPersonal.title    || data.profile?.jobTitle || data.profile?.headline || '';
        cv.personal.email    = savedPersonal.email    || data.email || '';
        cv.personal.phone    = savedPersonal.phone    || data.profile?.phone || '';
        cv.personal.location = savedPersonal.location || data.profile?.location || '';
        cv.personal.linkedin = savedPersonal.linkedin || data.profile?.linkedin || '';
        cv.personal.website  = savedPersonal.website  || data.profile?.website || '';

        // ── Summary: restore from saved data ──
        if (cvSync?.summary) {
          cv.summary = cvSync.summary;
        }

        // ── Experience: restore from saved data ──
        if (cvSync?.experience?.length > 0) {
          cv.experience = cvSync.experience;
        }

        // ── Skills from cvSyncData or profileData ──
        if (cvSync?.skills?.length > 0) {
          cv.skills = cvSync.skills;
        } else if (pd?.skills?.length > 0) {
          const byCategory = {};
          pd.skills.filter(s => s.name?.trim()).forEach(s => {
            if (!byCategory[s.category]) byCategory[s.category] = [];
            byCategory[s.category].push(s.name);
          });
          cv.skills = Object.entries(byCategory).map(([cat, items]) => `${cat}: ${items.join(', ')}`);
        }

        // ── Education from cvSyncData or profileData ──
        if (cvSync?.education?.length > 0) {
          cv.education = cvSync.education;
        } else if (pd?.education?.length > 0) {
          cv.education = pd.education.filter(e => e.degree?.trim() || e.institution?.trim()).map(e => ({
            degree: e.degree || '',
            institution: e.institution || '',
            dates: [e.startDate, e.endDate].filter(Boolean).join(' - '),
            grade: e.grade || '',
          }));
        }

        // ── Certifications: restore from saved data ──
        if (cvSync?.certifications?.length > 0) {
          cv.certifications = cvSync.certifications;
        }

        // Store as draft — user must click "Continue editing" to enter the editor
        const hasData = cv.personal.fullName || cv.skills.length > 0 || cv.education.length > 0 || cv.experience.length > 0;
        if (hasData) {
          setSavedCvDraft(cv);
        }
      } catch (err) {
        console.error('[CVBuilder] Profile sync load error:', err);
      } finally {
        setCvLoading(false);
      }
    };

    loadProfileIntoCv();
  }, [cvData, currentUser?.uid]);

  // ── Auto-save CV data to Firestore with debounce + emergency save ──────────
  const cvSaveTimerRef = useRef(null);
  const cvDataRef = useRef(cvData);   // always-current snapshot for beforeunload
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  cvDataRef.current = cvData;

  // Core save function (reusable)
  const saveCvToFirestore = useCallback(async (dataToSave) => {
    if (!dataToSave || !currentUser?.uid) return;
    setSaveStatus('saving');
    try {
      await setDoc(doc(db, 'users', currentUser.uid), {
        cvSyncData: {
          personal: dataToSave.personal || {},
          summary: dataToSave.summary || '',
          experience: (dataToSave.experience || []).map(e => ({
            role: e.role || '',
            company: e.company || '',
            dates: e.dates || '',
            location: e.location || '',
            bullets: e.bullets || [],
          })),
          skills: dataToSave.skills || [],
          education: (dataToSave.education || []).map(e => ({
            degree: e.degree || '',
            institution: e.institution || '',
            dates: e.dates || '',
            grade: e.grade || '',
          })),
          certifications: dataToSave.certifications || [],
          lastSynced: new Date(),
        },
      }, { merge: true });
      setSaveStatus('saved');
    } catch (err) {
      console.error('[CVBuilder] Auto-save error:', err);
      setSaveStatus('error');
    }
  }, [currentUser?.uid]);

  // Debounced auto-save on every cvData change (1.5s debounce)
  useEffect(() => {
    if (!cvData || !currentUser?.uid) return;
    setSaveStatus('idle');

    if (cvSaveTimerRef.current) clearTimeout(cvSaveTimerRef.current);
    cvSaveTimerRef.current = setTimeout(() => saveCvToFirestore(cvData), 1500);

    return () => { if (cvSaveTimerRef.current) clearTimeout(cvSaveTimerRef.current); };
  }, [cvData, currentUser?.uid, saveCvToFirestore]);

  // Emergency save on page close / tab switch
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (cvDataRef.current && currentUser?.uid) {
        // navigator.sendBeacon doesn't work with Firestore, so use sync-ish approach
        // Force the pending debounced save to fire immediately
        if (cvSaveTimerRef.current) clearTimeout(cvSaveTimerRef.current);
        saveCvToFirestore(cvDataRef.current);
      }
    };

    const handleVisibilityChange = () => {
      // Save when user switches tabs or minimises browser
      if (document.visibilityState === 'hidden' && cvDataRef.current && currentUser?.uid) {
        if (cvSaveTimerRef.current) clearTimeout(cvSaveTimerRef.current);
        saveCvToFirestore(cvDataRef.current);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser?.uid, saveCvToFirestore]);

  // ── Draggable resizer state ──
  const [splitPercent, setSplitPercent] = useState(50); // left panel width %
  const isDragging = useRef(false);
  const splitContainerRef = useRef(null);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging.current || !splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.min(75, Math.max(25, (x / rect.width) * 100));
      setSplitPercent(pct);
    };
    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // ── Sync raw text when switching to code editor ──
  useEffect(() => {
    if (editorMode === 'code' && cvData) {
      setRawText(cvDataToText(cvData));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorMode]);

  // ══════════════════════════════════════════════════════════════════════════
  // SINGLE-SOURCE PAGINATION: measures ACTUAL rendered page 1 content only.
  // No hidden div intermediary — contentMeasureRef sits outside overflow:hidden
  // so its scrollHeight is always the TRUE content height.
  // ══════════════════════════════════════════════════════════════════════════
  //
  // Page geometry:  960px page height - 36px top padding - 30px bottom padding = 894px usable
  // We allow content up to 870px (leaving ~24px breathing room before the page footer area).
  const MAX_CONTENT_H = 870;
  const correctionRef = useRef(0);

  useEffect(() => {
    if (!contentMeasureRef.current || !cvData) return;
    if (pageMode === '1') { setPageCount(1); setPage2Sections(null); return; }

    const runMeasure = () => {
      const el = contentMeasureRef.current;
      if (!el) return;
      const actualH = el.scrollHeight;
      setContentHeight(actualH);

      // ── FITS ON ONE PAGE ──
      if (actualH <= MAX_CONTENT_H && !page2Sections) {
        setPageCount(1);
        return;
      }

      // ── OVERFLOWS — need page 2 or need to push MORE to page 2 ──
      if (actualH > MAX_CONTENT_H) {
        if (correctionRef.current >= 10) return; // safety cap
        correctionRef.current += 1;

        if (!page2Sections) {
          // First overflow: initialise page2Sections by measuring what fits
          setPageCount(2);
          const validExpCount = cvData.experience.filter(e => e.role || e.company || e.dates || e.bullets.some(b => b.trim())).length;
          // Push certs first (smallest section)
          const hasCerts = cvData.certifications?.filter(c => c.trim()).length > 0;
          setPage2Sections({ expStart: validExpCount, showEdu: false, showSkills: false, showCerts: hasCerts });
        } else {
          // Already have page2, still overflowing — push more sections
          setPage2Sections(prev => {
            if (!prev) return prev;
            if (!prev.showCerts && cvData.certifications?.filter(c => c.trim()).length > 0)
              return { ...prev, showCerts: true };
            if (!prev.showSkills && cvData.skills?.filter(s => s.trim()).length > 0)
              return { ...prev, showSkills: true, showCerts: true };
            if (!prev.showEdu && cvData.education?.length > 0)
              return { ...prev, showEdu: true, showSkills: true, showCerts: true };
            if (prev.expStart > 1)
              return { ...prev, expStart: prev.expStart - 1 };
            return prev;
          });
        }
        return;
      }

      // ── PAGE 2 EXISTS BUT CONTENT NOW FITS — pull sections back ──
      if (page2Sections && actualH <= MAX_CONTENT_H) {
        // Try pulling back one section at a time
        const { expStart, showEdu, showSkills, showCerts } = page2Sections;
        const validExpCount = cvData.experience.filter(e => e.role || e.company || e.dates || e.bullets.some(b => b.trim())).length;

        // If everything is back on page 1, collapse to single page
        if (expStart >= validExpCount && !showEdu && !showSkills && !showCerts) {
          setPageCount(1);
          setPage2Sections(null);
          correctionRef.current = 0;
          return;
        }

        // Enough room to pull something back? Only if well under threshold
        if (actualH < MAX_CONTENT_H - 80) {
          correctionRef.current += 1;
          if (correctionRef.current >= 10) return;
          setPage2Sections(prev => {
            if (!prev) return prev;
            // Pull back in reverse order: exp → edu → skills → certs
            if (prev.expStart < validExpCount)
              return { ...prev, expStart: prev.expStart + 1 };
            if (prev.showEdu)
              return { ...prev, showEdu: false };
            if (prev.showSkills)
              return { ...prev, showSkills: false };
            if (prev.showCerts)
              return { ...prev, showCerts: false };
            return prev;
          });
        }
      }
    };

    // Reset correction counter when cvData changes (user editing)
    correctionRef.current = 0;

    // Run measurement at multiple timings to catch all DOM layout updates
    requestAnimationFrame(runMeasure);
    const t1 = setTimeout(runMeasure, 60);
    const t2 = setTimeout(runMeasure, 180);
    const t3 = setTimeout(runMeasure, 400);
    const t4 = setTimeout(runMeasure, 700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cvData, pageMode, page2Sections, pageCount]);

  // ── File upload ──
  const handleFileUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) { showError('Please upload a PDF or DOCX file'); return; }
    if (file.size > 10 * 1024 * 1024) { showError('File must be under 10 MB'); return; }

    setUploading(true);
    setUploadedFileName(file.name);
    try {
      const text = await extractTextFromFile(file);
      setRawText(text);
      const parsed = parseRawCVText(text);
      if (!parsed.personal.fullName && userProfile?.profile?.fullName) parsed.personal.fullName = userProfile.profile.fullName;
      if (!parsed.personal.email && currentUser?.email) parsed.personal.email = currentUser.email;
      setCvData(parsed);
      showSuccess('CV parsed! Edit in the form or switch to Code Editor.');
    } catch (err) {
      showError(err.message || 'Failed to parse CV');
    } finally {
      setUploading(false);
    }
  }, [currentUser, userProfile, showSuccess, showError]);

  // ── Recompile: re-parse raw text from code editor ──
  const handleRecompile = () => {
    if (!rawText.trim()) return;
    const parsed = parseRawCVText(rawText);
    setCvData(parsed);
    showSuccess('Recompiled! Preview updated.');
  };

  // ── Switch editor mode ──
  const switchEditorMode = (mode) => {
    if (mode === 'code' && cvData) {
      // Sync structured data → raw text
      setRawText(cvDataToText(cvData));
    }
    if (mode === 'visual' && rawText) {
      // Re-parse raw text → structured data
      const parsed = parseRawCVText(rawText);
      setCvData(parsed);
    }
    setEditorMode(mode);
  };

  // ── Field updaters ──
  const updatePersonal = (field, value) => setCvData(prev => ({ ...prev, personal: { ...prev.personal, [field]: value } }));

  const updateExperience = (idx, field, value) => {
    setCvData(prev => { const exp = [...prev.experience]; exp[idx] = { ...exp[idx], [field]: value }; return { ...prev, experience: exp }; });
  };
  const updateExpBullet = (expIdx, bulletIdx, value) => {
    setCvData(prev => { const exp = [...prev.experience]; const bullets = [...exp[expIdx].bullets]; bullets[bulletIdx] = value; exp[expIdx] = { ...exp[expIdx], bullets }; return { ...prev, experience: exp }; });
  };
  const addExpBullet = (expIdx) => {
    setCvData(prev => { const exp = [...prev.experience]; exp[expIdx] = { ...exp[expIdx], bullets: [...exp[expIdx].bullets, ''] }; return { ...prev, experience: exp }; });
  };
  const removeExpBullet = (expIdx, bulletIdx) => {
    setCvData(prev => { const exp = [...prev.experience]; exp[expIdx] = { ...exp[expIdx], bullets: exp[expIdx].bullets.filter((_, i) => i !== bulletIdx) }; return { ...prev, experience: exp }; });
  };
  const addExperience = () => setCvData(prev => ({ ...prev, experience: [...prev.experience, { role: '', company: '', dates: '', location: '', bullets: [''] }] }));
  const removeExperience = (idx) => setCvData(prev => ({ ...prev, experience: prev.experience.filter((_, i) => i !== idx) }));

  const updateEducation = (idx, field, value) => {
    setCvData(prev => { const edu = [...prev.education]; edu[idx] = { ...edu[idx], [field]: value }; return { ...prev, education: edu }; });
  };
  const addEducation = () => setCvData(prev => ({ ...prev, education: [...prev.education, { institution: '', degree: '', dates: '', grade: '' }] }));
  const removeEducation = (idx) => setCvData(prev => ({ ...prev, education: prev.education.filter((_, i) => i !== idx) }));

  const updateSkill = (idx, value) => setCvData(prev => { const skills = [...prev.skills]; skills[idx] = value; return { ...prev, skills }; });
  const addSkill = () => setCvData(prev => ({ ...prev, skills: [...prev.skills, ''] }));
  const removeSkill = (idx) => setCvData(prev => ({ ...prev, skills: prev.skills.filter((_, i) => i !== idx) }));

  // ── Inline preview editing ──
  const startInlineEdit = (type, value, index = null, field = null) => { setEditingField({ type, index, field }); setEditValue(value || ''); };
  const commitInlineEdit = () => {
    if (!editingField) return;
    const { type, index, field } = editingField;
    if (type === 'name') updatePersonal('fullName', editValue);
    else if (type === 'title') updatePersonal('title', editValue);
    else if (type === 'email') updatePersonal('email', editValue);
    else if (type === 'phone') updatePersonal('phone', editValue);
    else if (type === 'location') updatePersonal('location', editValue);
    else if (type === 'linkedin') updatePersonal('linkedin', editValue);
    else if (type === 'website') updatePersonal('website', editValue);
    else if (type === 'summary') setCvData(prev => ({ ...prev, summary: editValue }));
    else if (type === 'exp') updateExperience(index, field, editValue);
    else if (type === 'expBullet') updateExpBullet(index, field, editValue);
    else if (type === 'edu') updateEducation(index, field, editValue);
    else if (type === 'skill') updateSkill(index, editValue);
    else if (type === 'cert') setCvData(prev => { const c = [...prev.certifications]; c[index] = editValue; return { ...prev, certifications: c }; });
    setEditingField(null); setEditValue('');
  };
  const cancelInlineEdit = () => { setEditingField(null); setEditValue(''); };
  const handleInlineKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitInlineEdit(); } if (e.key === 'Escape') cancelInlineEdit(); };

  // ── Download / Print ──
  const handleDownload = () => {
    if (!cvData) return;
    const html = generateATSHtml(cvData);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${(cvData.personal.fullName || 'CV').replace(/\s+/g, '_')}_ATS_CV.html`; a.click();
    URL.revokeObjectURL(url);
    showSuccess('CV downloaded! Open the file and use Print → Save as PDF.');
  };
  const handlePrintPDF = () => {
    if (!cvData) return;
    const html = generateATSHtml(cvData);
    const w = window.open('', '_blank'); w.document.write(html); w.document.close();
    setTimeout(() => w.print(), 500);
  };

  const toggleSection = (s) => setExpandedSections(prev => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n; });

  // ── JD Analysis handler ──
  const handleAnalyzeJD = useCallback(async () => {
    if (!jobDescription.trim() || !cvData) return;
    setJdAnalyzing(true);
    try {
      // Small delay to feel like processing
      await new Promise(r => setTimeout(r, 600));
      const keywords = extractKeywordsFromJD(jobDescription);
      setHighlightedKeywords(keywords);
      const gaps = analyzeGaps(cvData, keywords);
      setJdAnalysis(gaps);
      const suggs = generateSuggestions(cvData, keywords, gaps);
      setJdSuggestions(suggs);
      setShowJdHighlighted(true);
      if (gaps.matchPercentage >= 70) showSuccess(`Great match! ${gaps.matchPercentage}% keyword alignment.`);
      else if (gaps.matchPercentage >= 40) showSuccess(`${gaps.matchPercentage}% match — review suggestions to improve.`);
      else showSuccess(`${gaps.matchPercentage}% match — follow the suggestions to improve your score.`);
    } catch (err) {
      showError('Analysis failed. Please try again.');
    } finally {
      setJdAnalyzing(false);
    }
  }, [jobDescription, cvData, showSuccess, showError]);

  // ── Apply suggestion helpers ──
  const applySummarySuggestion = () => {
    if (!jdSuggestions?.summary) return;
    setCvData(prev => ({ ...prev, summary: jdSuggestions.summary }));
    showSuccess('Summary updated with tailored content!');
  };

  const addSuggestedSkill = (skill) => {
    setCvData(prev => ({
      ...prev,
      skills: [...(prev.skills || []), skill],
    }));
    showSuccess(`Added "${skill}" to your skills.`);
  };

  const applyBulletSuggestion = (expIdx, bullet) => {
    setCvData(prev => {
      const exp = [...prev.experience];
      exp[expIdx] = { ...exp[expIdx], bullets: [...exp[expIdx].bullets, bullet] };
      return { ...prev, experience: exp };
    });
    showSuccess('Bullet point added to experience!');
  };


  /* ═════ UPLOAD SCREEN ═════ */
  const hasPremium = isPremiumUser(currentUser, userProfile);

  const applyTemplate = (template) => {
    if (!hasPremium) {
      showError('Premium templates require a subscription. Upgrade to access.');
      return;
    }
    // Deep clone template data so edits don't mutate the constant
    const data = JSON.parse(JSON.stringify(template.data));
    setCvData(data);
    setRawText(cvDataToText(data));
    showSuccess(`"${template.name}" template loaded! Customise with your details.`);
  };

  // ── Loading state: show spinner while checking Firestore for saved CV ──
  if (cvLoading) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-20" role="status" aria-label="Loading CV Builder">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Loading your CV...</p>
      </div>
    );
  }

  if (!cvData) {
    return (
      <div className="max-w-4xl mx-auto">

        {/* ── RESUME EXISTING CV (top of page) ── */}
        {savedCvDraft && (
          <div className="mb-6 p-5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Edit3 className="w-6 h-6 text-purple-600" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900">Continue editing your CV</p>
                <p className="text-sm text-gray-600 mt-0.5">
                  {savedCvDraft.personal?.fullName ? `Resume editing — ${savedCvDraft.personal.fullName}` : 'You have a saved CV draft. Pick up where you left off.'}
                </p>
              </div>
              <button
                onClick={() => { setCvData(savedCvDraft); setSavedCvDraft(null); }}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/20 transition-all text-sm min-h-[44px] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-500"
                aria-label="Continue editing your saved CV"
              >
                Open Editor
              </button>
            </div>
          </div>
        )}

        {/* Upload area — all-in-one box */}
        <div className="border-2 border-dashed border-gray-300 hover:border-purple-400 rounded-2xl p-8 text-center transition-all hover:bg-purple-50/30 group">
          <input ref={fileInputRef} type="file" accept=".pdf,.docx,.tex" onChange={handleFileUpload} className="hidden" />
          {uploading ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
              <p className="text-gray-600 font-medium">Parsing your CV...</p>
            </div>
          ) : (
            <>
              <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">ATS CV Builder</h2>
              <p className="text-gray-500 text-sm max-w-md mx-auto mb-5">Upload your CV and we'll convert it into a clean, ATS-friendly format. Or start from a premium template.</p>

              {/* Start from scratch */}
              <button onClick={() => setCvData(emptyCVData())}
                className="text-sm text-purple-600 hover:text-purple-800 font-medium underline underline-offset-4 transition-colors mb-5">
                Start from scratch with a blank CV
              </button>

              {/* Clickable upload zone */}
              <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer bg-white border border-gray-200 hover:border-purple-300 rounded-xl p-6 mx-auto max-w-md transition-colors hover:bg-purple-50/50 mb-6">
                <Upload className="w-8 h-8 text-gray-400 group-hover:text-purple-500 mx-auto mb-2 transition-colors" />
                <p className="text-base font-semibold text-gray-700 mb-1">Drop your CV here or click to upload</p>
                <p className="text-xs text-gray-400">Supports PDF, DOCX & LaTeX • Max 10 MB</p>
              </div>

              {/* Feature pills */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Terminal, label: 'Code Editor', desc: 'Edit raw text like Overleaf' },
                  { icon: Edit3, label: 'Visual Editor', desc: 'Forms and click-to-edit preview' },
                  { icon: Download, label: 'Download & Print', desc: 'Export HTML or print to PDF' },
                ].map((f, i) => (
                  <div key={i} className="text-center p-3 bg-gray-50 rounded-xl">
                    <f.icon className="w-5 h-5 text-purple-600 mx-auto mb-1.5" />
                    <p className="font-semibold text-xs text-gray-900">{f.label}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{f.desc}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── PREMIUM TEMPLATES ── */}
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-bold text-gray-900">Premium ATS Templates</h3>
            {hasPremium && <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-white">UNLOCKED</span>}
          </div>
          <p className="text-sm text-gray-500 mb-5">Industry-optimised templates with pre-written, ATS-friendly content. Choose one, then customise with your own details.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {CV_TEMPLATES.map(tmpl => (
              <div key={tmpl.id} className="relative border rounded-2xl overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 group flex flex-col"
                style={{ borderColor: hasPremium ? tmpl.color + '30' : '#e5e7eb', background: '#fff' }}>

                {/* Coloured top accent bar */}
                <div style={{ height: '4px', background: `linear-gradient(90deg, ${tmpl.color}, ${tmpl.color}99)` }} />

                {/* Card body */}
                <div className="p-5 flex flex-col flex-1">

                  {/* Header row: icon + title + badge */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: tmpl.color + '14' }}>
                      <Layout className="w-5 h-5" style={{ color: tmpl.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900" style={{ fontSize: '15px', lineHeight: '1.3' }}>{tmpl.name}</h4>
                    </div>
                    <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold flex-shrink-0"
                      style={{ background: hasPremium ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#6b7280', color: '#fff' }}>
                      {hasPremium ? <Star className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      {tmpl.tag}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-gray-500 mb-3 line-clamp-2" style={{ fontSize: '12px', lineHeight: '1.5' }}>{tmpl.description}</p>

                  {/* Preview tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {tmpl.preview.map((tag, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg font-medium" style={{ fontSize: '11px', background: tmpl.color + '10', color: tmpl.color, border: `1px solid ${tmpl.color}20` }}>{tag}</span>
                    ))}
                  </div>

                  {/* Mini CV preview — clean & compact */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-4 flex-1" style={{ minHeight: '140px' }}>
                    {/* Name header */}
                    <div className="text-center mb-3 pb-2" style={{ borderBottom: `2px solid ${tmpl.color}30` }}>
                      <p className="font-bold uppercase tracking-wide text-gray-800" style={{ fontSize: '12px' }}>{tmpl.data.personal.fullName}</p>
                      <p className="text-gray-500 mt-0.5" style={{ fontSize: '10px' }}>{tmpl.data.personal.title}</p>
                    </div>

                    {/* Experience entries */}
                    {tmpl.data.experience.slice(0, 2).map((exp, i) => (
                      <div key={i} className="mb-2">
                        <p className="font-semibold text-gray-800" style={{ fontSize: '11px', lineHeight: '1.3' }}>{exp.role}</p>
                        <p className="italic text-gray-400" style={{ fontSize: '10px' }}>{exp.company}</p>
                      </div>
                    ))}

                    {/* Skill previews */}
                    <div className="flex flex-wrap gap-1 mt-2 pt-2" style={{ borderTop: '1px solid #e5e7eb' }}>
                      {tmpl.data.skills.slice(0, 2).map((s, i) => {
                        const label = s.includes(':') ? s.split(':')[0] : s;
                        return <span key={i} className="px-2 py-0.5 bg-white rounded-md text-gray-500 border border-gray-200" style={{ fontSize: '9px' }}>{label}</span>;
                      })}
                      {tmpl.data.skills.length > 2 && <span className="px-2 py-0.5 bg-white rounded-md text-gray-400 border border-gray-200" style={{ fontSize: '9px' }}>+{tmpl.data.skills.length - 2} more</span>}
                    </div>
                  </div>

                  {/* Use button — pinned to bottom */}
                  <button
                    onClick={() => applyTemplate(tmpl)}
                    disabled={!hasPremium}
                    className="w-full py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                    style={{
                      fontSize: '13px',
                      background: hasPremium ? `linear-gradient(135deg, ${tmpl.color}, ${tmpl.color}cc)` : '#f3f4f6',
                      color: hasPremium ? '#fff' : '#9ca3af',
                      cursor: hasPremium ? 'pointer' : 'not-allowed',
                      boxShadow: hasPremium ? `0 4px 14px ${tmpl.color}30` : 'none',
                    }}
                    onMouseEnter={e => { if (hasPremium) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${tmpl.color}40`; } }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = hasPremium ? `0 4px 14px ${tmpl.color}30` : 'none'; }}>
                    {hasPremium ? <><Sparkles className="w-4 h-4" /> Use Template</> : <><Lock className="w-4 h-4" /> Upgrade</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    );
  }


  /* ═════ INLINE EDITING HELPERS ═════ */
  const isEditing = (type, index = null, field = null) =>
    editingField && editingField.type === type && editingField.index === index && editingField.field === field;

  const EditableText = ({ type, value, index = null, field = null, className = '', style: propStyle = {}, tag: Tag = 'span', placeholder = 'Click to edit', multiline = false }) => {
    if (isEditing(type, index, field)) {
      const cls = `${className} bg-blue-50 border border-blue-400 rounded px-1 py-0.5 outline-none focus:ring-2 focus:ring-blue-200`;
      return multiline
        ? <textarea autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={commitInlineEdit} onKeyDown={handleInlineKeyDown} className={`${cls} w-full resize-none`} rows={3} style={{ ...propStyle, fontSize: 'inherit', color: '#1a1a1a' }} />
        : <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={commitInlineEdit} onKeyDown={handleInlineKeyDown} className={cls} style={{ ...propStyle, fontSize: 'inherit', color: '#1a1a1a', width: Math.max(80, (editValue.length + 2) * 6.5) + 'px' }} />;
    }
    return (
      <Tag onClick={e => { e.stopPropagation(); startInlineEdit(type, value, index, field); }}
        className={`${className} cursor-pointer hover:bg-blue-50 hover:outline hover:outline-1 hover:outline-blue-300 rounded transition-all`}
        style={propStyle} title="Click to edit">
        {value || ''}
      </Tag>
    );
  };


  /* ═════════════════════════════════════════════════════════════════════════
     MAIN LAYOUT — Overleaf style
     ═════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="flex flex-col" style={{
      /* Break out of parent max-w-7xl container to go full-width.
         Use 100% instead of 100vw to avoid counting scrollbar width,
         which caused horizontal overflow on 14-inch screens.        */
      width: '100%',
      maxWidth: '100vw',
      marginLeft: 'calc(-50vw + 50%)',
      marginRight: 'calc(-50vw + 50%)',
      height: 'calc(100vh - 8rem)',   /* 8rem = navbar h-20 (5rem) + tabs bar (~3rem) */
      minHeight: '600px',
      overflow: 'hidden',
    }}>

      {/* ═══ TOP TOOLBAR ═══ */}
      <div className="flex items-center justify-between bg-white border-b border-gray-200 px-4 py-1.5 flex-shrink-0">
        {/* Left: file info + editor mode toggle */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-purple-600" />
          </div>
          <div className="hidden sm:block">
            <h3 className="font-bold text-gray-900 text-xs leading-tight">ATS CV Builder</h3>
            <p className="text-[9px] text-gray-400 leading-tight truncate max-w-[150px]">{uploadedFileName}</p>
          </div>

          {/* Overleaf-style Code Editor / Visual Editor toggle */}
          <div className="flex bg-gray-100 rounded-lg p-0.5 ml-2">
            <button onClick={() => switchEditorMode('code')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors flex items-center gap-1 ${
                editorMode === 'code'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              <Terminal className="w-3 h-3" /> Code Editor
            </button>
            <button onClick={() => switchEditorMode('visual')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors flex items-center gap-1 ${
                editorMode === 'visual'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              <Type className="w-3 h-3" /> Visual Editor
            </button>
          </div>
        </div>

        {/* Center: mobile toggle */}
        <div className="flex lg:hidden bg-gray-100 rounded-lg p-0.5">
          <button onClick={() => setMobileTab('jd')}
            className={`px-2 py-1 rounded text-[9px] font-medium ${mobileTab === 'jd' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'}`}>
            JD
          </button>
          <button onClick={() => setMobileTab('editor')}
            className={`px-2 py-1 rounded text-[9px] font-medium ${mobileTab === 'editor' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500'}`}>
            Editor
          </button>
          <button onClick={() => setMobileTab('preview')}
            className={`px-2 py-1 rounded text-[9px] font-medium ${mobileTab === 'preview' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500'}`}>
            Preview
          </button>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1">
          {/* Recompile (code editor mode) */}
          {editorMode === 'code' && (
            <button onClick={handleRecompile}
              className="px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] font-medium transition-colors flex items-center gap-1 mr-1">
              <RefreshCw className="w-3 h-3" /> Recompile
            </button>
          )}

          {/* Zoom */}
          <div className="hidden lg:flex items-center gap-0.5">
            <button onClick={() => setZoom(z => Math.max(60, z - 10))} className="p-1 text-gray-400 hover:text-gray-600 rounded"><ZoomOut className="w-3.5 h-3.5" /></button>
            <span className="text-[9px] text-gray-500 font-mono w-7 text-center">{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(150, z + 10))} className="p-1 text-gray-400 hover:text-gray-600 rounded"><ZoomIn className="w-3.5 h-3.5" /></button>
          </div>

          {/* Auto-save status indicator */}
          {cvData && (
            <span className={`hidden sm:flex items-center gap-1 text-[9px] font-medium px-2 py-1 rounded-full ${
              saveStatus === 'saving' ? 'text-amber-600 bg-amber-50' :
              saveStatus === 'saved'  ? 'text-green-600 bg-green-50' :
              saveStatus === 'error'  ? 'text-red-600 bg-red-50' :
              'text-gray-400'
            }`}>
              {saveStatus === 'saving' && <><RefreshCw className="w-2.5 h-2.5 animate-spin" /> Saving…</>}
              {saveStatus === 'saved'  && <><CheckCircle className="w-2.5 h-2.5" /> Saved</>}
              {saveStatus === 'error'  && <><AlertTriangle className="w-2.5 h-2.5" /> Save failed</>}
            </span>
          )}

          <button onClick={() => { setSavedCvDraft(cvData); setCvData(null); setRawText(''); setUploadedFileName(''); }}
            className="px-2 py-1 text-[10px] text-gray-500 hover:text-red-600 rounded hover:bg-red-50 flex items-center gap-0.5">
            <RefreshCw className="w-3 h-3" /> New
          </button>
          <button onClick={handlePrintPDF}
            className="px-2 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] font-medium flex items-center gap-1">
            <Printer className="w-3 h-3" /> Print PDF
          </button>
          <button onClick={handleDownload}
            className="px-2 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-medium flex items-center gap-1">
            <Download className="w-3 h-3" /> Download
          </button>
        </div>
      </div>


      {/* ═══ SPLIT PANEL ═══ */}
      <div ref={splitContainerRef} className="flex flex-1 overflow-hidden" style={{ position: 'relative' }}>

        {/* ─── LEFT PANEL: EDITOR ─── */}
        <div className={`${mobileTab === 'preview' ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-auto`}
          style={{ width: `${splitPercent}%`, minWidth: 0, flexShrink: 0 }}>

          {/* ═══ JOB DESCRIPTION PANEL ═══ */}
          <div className="flex-shrink-0" style={{ borderBottom: '1px solid #e0e7ef' }}>
            {/* JD Header — collapsible */}
            <button onClick={() => setJdExpanded(!jdExpanded)}
              className="w-full flex items-center justify-between px-3 py-2 transition-colors"
              style={{ background: '#eef4fb' }}>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: '#3b82f6' }}>
                  <Target className="w-3 h-3 text-white" />
                </div>
                <span className="text-[11px] font-semibold" style={{ color: '#1e3a5f' }}>Job Description</span>
                {jdAnalysis && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: jdAnalysis.matchPercentage >= 70 ? '#dcfce7' : jdAnalysis.matchPercentage >= 40 ? '#fef9c3' : '#fee2e2',
                      color: jdAnalysis.matchPercentage >= 70 ? '#166534' : jdAnalysis.matchPercentage >= 40 ? '#854d0e' : '#991b1b',
                    }}>
                    {jdAnalysis.matchPercentage}% match
                  </span>
                )}
              </div>
              {jdExpanded ? <ChevronUp className="w-3.5 h-3.5" style={{ color: '#6b7280' }} /> : <ChevronDown className="w-3.5 h-3.5" style={{ color: '#6b7280' }} />}
            </button>

            {/* JD Body */}
            <AnimatePresence>
              {jdExpanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }} className="overflow-hidden" style={{ background: '#f8fafc' }}>
                  <div className="px-3 py-2 space-y-2">

                    {/* Textarea for pasting JD */}
                    <div className="relative">
                      <textarea
                        value={jobDescription}
                        onChange={(e) => { setJobDescription(e.target.value); if (jdAnalysis) { setJdAnalysis(null); setJdSuggestions(null); setHighlightedKeywords([]); setShowJdHighlighted(false); } }}
                        placeholder="Paste the job description here to analyse keywords, identify gaps, and tailor your CV..."
                        className="w-full p-2.5 border rounded-lg text-[11px] leading-relaxed outline-none resize-none transition-colors"
                        style={{ borderColor: '#d1d5db', background: '#fff', color: '#1f2937', minHeight: '80px', maxHeight: '160px' }}
                        onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 2px rgba(59,130,246,0.15)'; }}
                        onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                        rows={4}
                      />
                      {jobDescription && (
                        <button onClick={() => { setJobDescription(''); setJdAnalysis(null); setJdSuggestions(null); setHighlightedKeywords([]); setShowJdHighlighted(false); }}
                          className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-colors"
                          style={{ background: '#f3f4f6', color: '#9ca3af' }}
                          onMouseEnter={(e) => { e.target.style.background = '#fee2e2'; e.target.style.color = '#ef4444'; }}
                          onMouseLeave={(e) => { e.target.style.background = '#f3f4f6'; e.target.style.color = '#9ca3af'; }}>
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Analyse Button */}
                    <button
                      onClick={handleAnalyzeJD}
                      disabled={!jobDescription.trim() || !cvData || jdAnalyzing}
                      className="w-full py-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-2 transition-all"
                      style={{
                        background: (!jobDescription.trim() || !cvData || jdAnalyzing) ? '#e5e7eb' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
                        color: (!jobDescription.trim() || !cvData || jdAnalyzing) ? '#9ca3af' : '#fff',
                        cursor: (!jobDescription.trim() || !cvData || jdAnalyzing) ? 'not-allowed' : 'pointer',
                        boxShadow: (!jobDescription.trim() || !cvData || jdAnalyzing) ? 'none' : '0 2px 8px rgba(59,130,246,0.3)',
                      }}>
                      {jdAnalyzing ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analysing...</>
                      ) : (
                        <><Sparkles className="w-3.5 h-3.5" /> Analyse &amp; Tailor CV</>
                      )}
                    </button>

                    {/* ═══ ANALYSIS RESULTS ═══ */}
                    {jdAnalysis && (
                      <div className="space-y-3 pt-2" style={{ borderTop: '1px solid #e5e7eb' }}>

                        {/* Match Score Bar */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-semibold" style={{ color: '#374151' }}>Match Score</span>
                            <span className="text-[10px] font-bold" style={{
                              color: jdAnalysis.matchPercentage >= 70 ? '#16a34a' : jdAnalysis.matchPercentage >= 40 ? '#ca8a04' : '#dc2626'
                            }}>{jdAnalysis.matchPercentage}%</span>
                          </div>
                          <div className="w-full rounded-full h-2" style={{ background: '#e5e7eb' }}>
                            <div className="h-2 rounded-full transition-all duration-500" style={{
                              width: `${jdAnalysis.matchPercentage}%`,
                              background: jdAnalysis.matchPercentage >= 70
                                ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                                : jdAnalysis.matchPercentage >= 40
                                  ? 'linear-gradient(90deg, #facc15, #eab308)'
                                  : 'linear-gradient(90deg, #f87171, #dc2626)',
                            }} />
                          </div>
                          <p className="text-[9px] mt-0.5" style={{ color: '#6b7280' }}>
                            {jdAnalysis.matchedKeywords.length} of {jdAnalysis.totalKeywords} keywords found in your CV
                          </p>
                        </div>

                        {/* Highlighted JD Toggle */}
                        <button onClick={() => setShowJdHighlighted(!showJdHighlighted)}
                          className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors"
                          style={{ background: showJdHighlighted ? '#dbeafe' : '#f3f4f6', color: showJdHighlighted ? '#1d4ed8' : '#4b5563' }}>
                          <Eye className="w-3 h-3" />
                          {showJdHighlighted ? 'Hide' : 'View'} Highlighted JD
                        </button>

                        {/* Highlighted JD View */}
                        {showJdHighlighted && (
                          <div className="p-2.5 rounded-lg border max-h-40 overflow-y-auto" style={{ background: '#fffef5', borderColor: '#fde68a' }}>
                            <HighlightedJDText text={jobDescription} keywords={highlightedKeywords} />
                          </div>
                        )}

                        {/* Missing Skills — clickable to add */}
                        {jdSuggestions?.skillsToAdd?.length > 0 && (
                          <div>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <PlusCircle className="w-3 h-3" style={{ color: '#d97706' }} />
                              <span className="text-[10px] font-semibold" style={{ color: '#374151' }}>Missing Skills</span>
                              <span className="text-[9px]" style={{ color: '#6b7280' }}>— click to add</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {jdSuggestions.skillsToAdd.map((skill, i) => (
                                <button key={i} onClick={() => addSuggestedSkill(skill)}
                                  className="px-2 py-1 rounded text-[9px] font-medium transition-all"
                                  style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}
                                  onMouseEnter={(e) => { e.target.style.background = '#fde68a'; e.target.style.transform = 'scale(1.05)'; }}
                                  onMouseLeave={(e) => { e.target.style.background = '#fef3c7'; e.target.style.transform = 'scale(1)'; }}
                                  title={`Click to add "${skill}" to your CV skills`}>
                                  + {skill}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Suggested Summary Rewrite */}
                        {jdSuggestions?.summary && (
                          <div className="p-2.5 rounded-lg border" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Sparkles className="w-3 h-3" style={{ color: '#2563eb' }} />
                              <span className="text-[10px] font-semibold" style={{ color: '#1e40af' }}>Suggested Summary</span>
                            </div>
                            <p className="text-[10px] leading-relaxed mb-2" style={{ color: '#374151' }}>{jdSuggestions.summary}</p>
                            <button onClick={applySummarySuggestion}
                              className="px-3 py-1 rounded text-[10px] font-semibold transition-colors"
                              style={{ background: '#2563eb', color: '#fff' }}
                              onMouseEnter={(e) => { e.target.style.background = '#1d4ed8'; }}
                              onMouseLeave={(e) => { e.target.style.background = '#2563eb'; }}>
                              Apply to CV
                            </button>
                          </div>
                        )}

                        {/* Bullet Suggestions */}
                        {jdSuggestions?.bulletSuggestions && Object.keys(jdSuggestions.bulletSuggestions).length > 0 && (
                          <div>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <TrendingUp className="w-3 h-3" style={{ color: '#7c3aed' }} />
                              <span className="text-[10px] font-semibold" style={{ color: '#374151' }}>Suggested Bullet Points</span>
                            </div>
                            {Object.entries(jdSuggestions.bulletSuggestions).map(([idx, bullet]) => (
                              <div key={idx} className="p-2 rounded border mb-1.5" style={{ background: '#f5f3ff', borderColor: '#ddd6fe' }}>
                                <p className="text-[9px] font-medium mb-1" style={{ color: '#6b7280' }}>
                                  For: {cvData.experience[parseInt(idx)]?.role || `Experience ${parseInt(idx) + 1}`}
                                </p>
                                <p className="text-[10px] mb-1.5" style={{ color: '#374151' }}>{bullet}</p>
                                <button onClick={() => applyBulletSuggestion(parseInt(idx), bullet)}
                                  className="px-2 py-0.5 rounded text-[9px] font-semibold transition-colors"
                                  style={{ background: '#7c3aed', color: '#fff' }}
                                  onMouseEnter={(e) => { e.target.style.background = '#6d28d9'; }}
                                  onMouseLeave={(e) => { e.target.style.background = '#7c3aed'; }}>
                                  Add Bullet
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Advice */}
                        {jdSuggestions?.advice?.length > 0 && (
                          <div className="p-2.5 rounded-lg" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <AlertCircle className="w-3 h-3" style={{ color: '#16a34a' }} />
                              <span className="text-[10px] font-semibold" style={{ color: '#166534' }}>Tailoring Advice</span>
                            </div>
                            <ul className="space-y-1">
                              {jdSuggestions.advice.map((tip, i) => (
                                <li key={i} className="text-[9.5px] leading-relaxed pl-3 relative" style={{ color: '#374151' }}>
                                  <span className="absolute left-0" style={{ color: '#16a34a' }}>•</span>
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Editor panel header — hidden on mobile when JD tab active */}
          <div className={`${mobileTab === 'jd' ? 'hidden lg:flex' : 'flex'} items-center gap-2 px-3 py-1.5 flex-shrink-0`}
            style={{ background: editorMode === 'code' ? '#1e1e1e' : '#fafafa', borderBottom: '1px solid #e5e7eb' }}>
            {editorMode === 'code'
              ? <><Terminal className="w-3 h-3 text-green-400" /><span className="text-[10px] font-mono text-green-400">cv-content.txt</span><span className="text-[10px] text-gray-500 ml-auto">Edit text → Recompile to update preview</span></>
              : <><Pencil className="w-3 h-3 text-gray-500" /><span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Visual Editor</span><span className="text-[10px] text-gray-400 ml-auto">Edit fields below</span></>
            }
          </div>

          {/* Editor content — hidden on mobile when JD tab active */}
          <div className={`${mobileTab === 'jd' ? 'hidden lg:block' : ''} flex-1 overflow-y-auto`} style={{ background: editorMode === 'code' ? '#1e1e1e' : '#ffffff' }}>

            {/* ══ CODE EDITOR ══ */}
            {editorMode === 'code' && (
              <div className="h-full flex">
                {/* Line numbers */}
                <div className="py-3 px-2 text-right select-none flex-shrink-0" style={{ background: '#252526', minWidth: '36px' }}>
                  {rawText.split('\n').map((_, i) => (
                    <div key={i} className="text-[10px] leading-[18px] font-mono" style={{ color: '#858585' }}>{i + 1}</div>
                  ))}
                </div>
                {/* Text area */}
                <textarea
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  className="flex-1 p-3 outline-none resize-none font-mono text-[11px] leading-[18px]"
                  style={{
                    background: '#1e1e1e',
                    color: '#d4d4d4',
                    caretColor: '#ffffff',
                    border: 'none',
                    tabSize: 2,
                  }}
                  spellCheck={false}
                  placeholder="Paste or edit your CV text here..."
                />
              </div>
            )}

            {/* ══ VISUAL EDITOR ══ */}
            {editorMode === 'visual' && (
              <div className="p-3 space-y-2">
                {/* Personal Info */}
                <EditorSection title="Personal Information" icon={<Mail className="w-3.5 h-3.5" />}
                  expanded={expandedSections.has('personal')} onToggle={() => toggleSection('personal')}>
                  <div className="grid grid-cols-2 gap-2">
                    <FieldInput label="Full Name" value={cvData.personal.fullName} onChange={v => updatePersonal('fullName', v)} className="col-span-2" />
                    <FieldInput label="Professional Title" value={cvData.personal.title} onChange={v => updatePersonal('title', v)} className="col-span-2" />
                    <FieldInput label="Email" value={cvData.personal.email} onChange={v => updatePersonal('email', v)} icon={<Mail className="w-3 h-3" />} />
                    <FieldInput label="Phone" value={cvData.personal.phone} onChange={v => updatePersonal('phone', v)} icon={<Phone className="w-3 h-3" />} />
                    <FieldInput label="Location" value={cvData.personal.location} onChange={v => updatePersonal('location', v)} icon={<MapPin className="w-3 h-3" />} />
                    <FieldInput label="LinkedIn" value={cvData.personal.linkedin} onChange={v => updatePersonal('linkedin', v)} icon={<Linkedin className="w-3 h-3" />} />
                    <FieldInput label="Website" value={cvData.personal.website} onChange={v => updatePersonal('website', v)} icon={<Globe className="w-3 h-3" />} className="col-span-2" />
                  </div>
                </EditorSection>

                <EditorSection title="Professional Summary" icon={<FileText className="w-3.5 h-3.5" />}
                  expanded={expandedSections.has('summary')} onToggle={() => toggleSection('summary')}>
                  <textarea value={cvData.summary} onChange={e => setCvData(prev => ({ ...prev, summary: e.target.value }))}
                    rows={3} placeholder="Brief 2-3 sentence summary..."
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none resize-none" />
                </EditorSection>

                <EditorSection title={`Experience (${cvData.experience.length})`} icon={<Briefcase className="w-3.5 h-3.5" />}
                  expanded={expandedSections.has('experience')} onToggle={() => toggleSection('experience')}>
                  {cvData.experience.map((exp, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-2.5 mb-2 relative group">
                      <button onClick={() => removeExperience(i)} className="absolute top-1.5 right-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                      <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                        <FieldInput label="Role" value={exp.role} onChange={v => updateExperience(i, 'role', v)} className="col-span-2" />
                        <FieldInput label="Company" value={exp.company} onChange={v => updateExperience(i, 'company', v)} />
                        <FieldInput label="Dates" value={exp.dates} onChange={v => updateExperience(i, 'dates', v)} />
                        <FieldInput label="Location" value={exp.location} onChange={v => updateExperience(i, 'location', v)} className="col-span-2" />
                      </div>
                      <label className="text-[10px] font-medium text-gray-500 mb-0.5 block">Achievements</label>
                      {exp.bullets.map((b, bi) => (
                        <div key={bi} className="flex items-start gap-1 mb-1">
                          <span className="text-gray-400 mt-1.5 text-[10px]">•</span>
                          <textarea value={b} onChange={e => updateExpBullet(i, bi, e.target.value)} rows={1}
                            className="flex-1 px-1.5 py-1 border border-gray-200 rounded text-[11px] focus:ring-1 focus:ring-purple-200 focus:border-purple-400 outline-none resize-none" />
                          <button onClick={() => removeExpBullet(i, bi)} className="text-gray-300 hover:text-red-400 mt-1"><Trash2 className="w-2.5 h-2.5" /></button>
                        </div>
                      ))}
                      <button onClick={() => addExpBullet(i)} className="text-[10px] text-purple-600 hover:text-purple-700 font-medium flex items-center gap-0.5 mt-0.5"><Plus className="w-2.5 h-2.5" /> Add bullet</button>
                    </div>
                  ))}
                  <button onClick={addExperience} className="w-full py-1.5 border border-dashed border-gray-300 rounded-lg text-[10px] text-gray-500 hover:text-purple-600 hover:border-purple-300 flex items-center justify-center gap-1"><Plus className="w-3 h-3" /> Add experience</button>
                </EditorSection>

                <EditorSection title={`Education (${cvData.education.length})`} icon={<GraduationCap className="w-3.5 h-3.5" />}
                  expanded={expandedSections.has('education')} onToggle={() => toggleSection('education')}>
                  {cvData.education.map((edu, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-2.5 mb-2 relative group">
                      <button onClick={() => removeEducation(i)} className="absolute top-1.5 right-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                      <div className="grid grid-cols-2 gap-1.5">
                        <FieldInput label="Institution" value={edu.institution} onChange={v => updateEducation(i, 'institution', v)} className="col-span-2" />
                        <FieldInput label="Degree" value={edu.degree} onChange={v => updateEducation(i, 'degree', v)} className="col-span-2" />
                        <FieldInput label="Dates" value={edu.dates} onChange={v => updateEducation(i, 'dates', v)} />
                        <FieldInput label="Grade" value={edu.grade} onChange={v => updateEducation(i, 'grade', v)} />
                      </div>
                    </div>
                  ))}
                  <button onClick={addEducation} className="w-full py-1.5 border border-dashed border-gray-300 rounded-lg text-[10px] text-gray-500 hover:text-purple-600 hover:border-purple-300 flex items-center justify-center gap-1"><Plus className="w-3 h-3" /> Add education</button>
                </EditorSection>

                <EditorSection title={`Skills (${cvData.skills.length})`} icon={<Code className="w-3.5 h-3.5" />}
                  expanded={expandedSections.has('skills')} onToggle={() => toggleSection('skills')}>
                  <div className="flex flex-wrap gap-1.5">
                    {cvData.skills.map((skill, i) => (
                      <div key={i} className="flex items-center gap-0.5 bg-gray-50 rounded px-1.5 py-0.5 group">
                        <input value={skill} onChange={e => updateSkill(i, e.target.value)}
                          className="bg-transparent text-[11px] font-medium text-gray-700 outline-none w-20 focus:w-28 transition-all" />
                        <button onClick={() => removeSkill(i)} className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-2.5 h-2.5" /></button>
                      </div>
                    ))}
                    <button onClick={addSkill} className="px-1.5 py-0.5 border border-dashed border-gray-300 rounded text-[10px] text-gray-500 hover:text-purple-600 hover:border-purple-300 flex items-center gap-0.5"><Plus className="w-2.5 h-2.5" /> Add</button>
                  </div>
                </EditorSection>

                <EditorSection title={`Certifications & Awards (${cvData.certifications.length})`} icon={<Award className="w-3.5 h-3.5" />}
                  expanded={expandedSections.has('certifications')} onToggle={() => toggleSection('certifications')}>
                  {cvData.certifications.map((cert, i) => (
                    <div key={i} className="flex items-center gap-1.5 mb-1.5">
                      <input value={cert} onChange={e => { setCvData(prev => { const c = [...prev.certifications]; c[i] = e.target.value; return { ...prev, certifications: c }; }); }}
                        className="flex-1 px-1.5 py-1 border border-gray-200 rounded text-[11px] focus:ring-1 focus:ring-purple-200 focus:border-purple-400 outline-none" />
                      <button onClick={() => setCvData(prev => ({ ...prev, certifications: prev.certifications.filter((_, idx) => idx !== i) }))} className="text-gray-300 hover:text-red-400"><Trash2 className="w-2.5 h-2.5" /></button>
                    </div>
                  ))}
                  <button onClick={() => setCvData(prev => ({ ...prev, certifications: [...prev.certifications, ''] }))}
                    className="text-[10px] text-purple-600 hover:text-purple-700 font-medium flex items-center gap-0.5"><Plus className="w-2.5 h-2.5" /> Add certification</button>
                </EditorSection>
              </div>
            )}
          </div>
        </div>


        {/* ─── DRAG HANDLE ─── */}
        <div
          onMouseDown={handleMouseDown}
          className="hidden lg:flex items-center justify-center flex-shrink-0"
          style={{
            width: '6px',
            cursor: 'col-resize',
            background: '#e5e7eb',
            transition: 'background 0.15s',
            zIndex: 10,
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#a78bfa'}
          onMouseLeave={e => { if (!isDragging.current) e.currentTarget.style.background = '#e5e7eb'; }}
        >
          <div style={{ width: '2px', height: '32px', borderRadius: '1px', background: '#9ca3af' }} />
        </div>

        {/* ─── RIGHT PANEL: LIVE A4 PREVIEW ─── */}
        <div className={`${mobileTab === 'editor' ? 'hidden lg:flex' : 'flex'} flex-col`}
          style={{ background: '#404040', flex: 1, minWidth: 0 }}>

          {/* Preview header */}
          <div className="flex items-center justify-between px-3 py-1.5 flex-shrink-0" style={{ background: '#353535', borderBottom: '1px solid #555' }}>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1">
                <Eye className="w-3 h-3" /> Preview
              </span>
              <span className="text-[10px] text-blue-400 ml-1">Click text to edit</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> ATS Ready</span>
              <span className="text-[10px] text-gray-400 font-mono">{pageCount} / 2</span>
            </div>
          </div>

          {/* Scrollable preview area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ background: '#404040' }}>
            <div className="flex flex-col items-center py-5 gap-12" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center', width: '100%' }}>

              {/* ── A4 Page 1 ── */}
              <div style={{ width: '100%', maxWidth: '680px', minHeight: '960px', maxHeight: '960px', height: '960px', background: '#fff', boxShadow: '0 4px 25px rgba(0,0,0,0.4)', borderRadius: '2px', fontFamily: "'Georgia', 'Times New Roman', serif", position: 'relative', overflow: 'hidden', flexShrink: 0, lineHeight: '1.15' }}>
                <div style={{ padding: '36px 48px 30px 48px' }}>
                <div ref={contentMeasureRef}>
                  {/* Header */}
                  <div className="text-center pb-2" style={{ borderBottom: '2px solid #1a1a1a', marginBottom: '10px' }}>
                    <EditableText type="name" value={cvData.personal.fullName} tag="h1" className="font-bold uppercase tracking-widest block" style={{ color: '#1a1a1a', fontSize: '15px', marginBottom: '3px' }} placeholder="YOUR NAME" />
                    <EditableText type="title" value={cvData.personal.title} tag="p" className="block" style={{ color: '#333', fontSize: '11px', marginBottom: '6px' }} placeholder="Professional Title" />
                    <div className="flex flex-wrap justify-center gap-x-3 gap-y-0.5" style={{ color: '#444', fontSize: '10px' }}>
                      {cvData.personal.email && <EditableText type="email" value={cvData.personal.email} />}
                      {cvData.personal.phone && <><span style={{ color: '#888' }}>|</span><EditableText type="phone" value={cvData.personal.phone} /></>}
                      {cvData.personal.location && <><span style={{ color: '#888' }}>|</span><EditableText type="location" value={cvData.personal.location} /></>}
                      {cvData.personal.linkedin && <><span style={{ color: '#888' }}>|</span><EditableText type="linkedin" value={cvData.personal.linkedin} /></>}
                      {cvData.personal.website && <><span style={{ color: '#888' }}>|</span><EditableText type="website" value={cvData.personal.website} /></>}
                    </div>
                  </div>

                  {cvData.summary && (
                    <div style={{ marginBottom: '10px' }}>
                      <SectionHeading>Professional Summary</SectionHeading>
                      <EditableText type="summary" value={cvData.summary} tag="p" className="block" style={{ color: '#333', fontSize: '10px', lineHeight: '1.4' }} multiline />
                    </div>
                  )}

                  {(() => {
                    const validExp = cvData.experience.filter(e => e.role || e.company || e.dates || e.bullets.some(b => b.trim()));
                    const page1Exp = (page2Sections && pageCount >= 2) ? validExp.slice(0, page2Sections.expStart) : validExp;
                    const showEduOnPage1 = !(page2Sections && page2Sections.showEdu);
                    const showSkillsOnPage1 = !(page2Sections && page2Sections.showSkills);
                    const showCertsOnPage1 = !(page2Sections && page2Sections.showCerts);
                    return (<>
                  {page1Exp.length > 0 && (
                    <div style={{ marginBottom: '10px' }}>
                      <SectionHeading>Experience</SectionHeading>
                      {page1Exp.map((exp, i) => (
                        <div key={i} className="group/entry relative" style={{ marginBottom: '8px' }}>
                          <button onClick={() => removeExperience(i)} className="absolute -right-1 -top-1 w-4 h-4 bg-red-500 text-white rounded-full text-[8px] flex items-center justify-center opacity-0 group-hover/entry:opacity-100 transition-opacity z-10" title="Delete entry">×</button>
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <EditableText type="exp" value={exp.role} index={i} field="role" tag="p" className="font-bold block" style={{ color: '#1a1a1a', fontSize: '11px' }} placeholder="Role" />
                              {exp.company && exp.company !== 'Project' && <div className="italic flex items-center gap-0.5 flex-wrap" style={{ color: '#444', fontSize: '10px' }}>
                                <EditableText type="exp" value={exp.company} index={i} field="company" placeholder="Company" />
                                {exp.location && <><span>,</span><EditableText type="exp" value={exp.location} index={i} field="location" /></>}
                              </div>}
                            </div>
                            {exp.dates && <EditableText type="exp" value={exp.dates} index={i} field="dates" className="flex-shrink-0 ml-2 font-medium" style={{ color: '#555', fontSize: '10px' }} placeholder="" />}
                          </div>
                          {exp.bullets.filter(b => b.trim()).length > 0 && (
                            <ul style={{ marginTop: '2px', marginLeft: '10px' }}>
                              {exp.bullets.filter(b => b.trim()).map((b, bi) => (
                                <li key={bi} className="pl-2.5 relative" style={{ listStyle: 'none', color: '#333', fontSize: '10px', lineHeight: '1.35' }}>
                                  <span className="absolute left-0" style={{ color: '#555' }}>•</span>
                                  <EditableText type="expBullet" value={b} index={i} field={bi} />
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {showEduOnPage1 && cvData.education.length > 0 && (
                    <div style={{ marginBottom: '10px' }}>
                      <SectionHeading>Education</SectionHeading>
                      {cvData.education.map((edu, i) => (
                        <div key={i} className="group/edu relative" style={{ marginBottom: '5px' }}>
                          <button onClick={() => removeEducation(i)} className="absolute -right-1 -top-1 w-4 h-4 bg-red-500 text-white rounded-full text-[8px] flex items-center justify-center opacity-0 group-hover/edu:opacity-100 transition-opacity z-10" title="Delete entry">×</button>
                          <div className="flex justify-between items-start">
                            <div>
                              <EditableText type="edu" value={edu.institution} index={i} field="institution" tag="p" className="font-bold block" style={{ color: '#1a1a1a', fontSize: '11px' }} placeholder="Institution" />
                              <div className="italic" style={{ color: '#444', fontSize: '10px' }}>
                                <EditableText type="edu" value={edu.degree} index={i} field="degree" placeholder="Degree" />
                                {edu.grade && <span> — <EditableText type="edu" value={edu.grade} index={i} field="grade" /></span>}
                              </div>
                            </div>
                            {edu.dates && <EditableText type="edu" value={edu.dates} index={i} field="dates" className="flex-shrink-0 ml-2 font-medium" style={{ color: '#555', fontSize: '10px' }} placeholder="" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {showSkillsOnPage1 && cvData.skills.length > 0 && (
                    <div style={{ marginBottom: '10px' }}>
                      <SectionHeading>Skills</SectionHeading>
                      <SkillsRenderer skills={cvData.skills} editable onEdit={(idx, val) => updateSkill(idx, val)} editingField={editingField} editValue={editValue} startInlineEdit={startInlineEdit} commitInlineEdit={commitInlineEdit} handleInlineKeyDown={handleInlineKeyDown} setEditValue={setEditValue} isEditing={isEditing} />
                    </div>
                  )}

                  {showCertsOnPage1 && cvData.certifications.length > 0 && (
                    <div style={{ marginBottom: '8px' }}>
                      <SectionHeading>Certifications & Awards</SectionHeading>
                      <ul style={{ marginLeft: '10px' }}>
                        {cvData.certifications.filter(c => c.trim()).map((cert, i) => (
                          <li key={i} className="pl-2.5 relative" style={{ listStyle: 'none', color: '#333', fontSize: '10px', lineHeight: '1.35' }}>
                            <span className="absolute left-0" style={{ color: '#555' }}>•</span>
                            <EditableText type="cert" value={cert} index={i} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  </>);
                  })()}
                </div>
                </div>{/* close padding div */}
                {/* Page footer */}
                <div style={{ position: 'absolute', bottom: '12px', left: 0, right: 0, textAlign: 'center', fontSize: '8px', color: '#aaa' }}>
                  1 / {pageCount}
                </div>
              </div>

              {/* ── A4 Page 2 — NO header, only overflow content ── */}
              {pageCount >= 2 && page2Sections && (
                <div style={{ width: '100%', maxWidth: '680px', minHeight: '960px', maxHeight: '960px', height: '960px', background: '#fff', boxShadow: '0 4px 25px rgba(0,0,0,0.4)', borderRadius: '2px', fontFamily: "'Georgia', 'Times New Roman', serif", position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                  <div style={{ padding: '32px 48px 28px 48px', maxHeight: '900px', overflow: 'hidden' }}>
                    <Page2Overflow cvData={cvData} sections={page2Sections} />
                  </div>
                  <div style={{ position: 'absolute', bottom: '12px', left: 0, right: 0, textAlign: 'center', fontSize: '8px', color: '#aaa' }}>
                    2 / {pageCount}
                  </div>
                </div>
              )}

              {/* Page mode toggle */}
              <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: '#555' }}>
                <FileText className="w-3 h-3 text-gray-400" />
                {['auto', '1', '2'].map(mode => (
                  <button key={mode} onClick={() => setPageMode(mode)}
                    className="px-2 py-0.5 rounded-full text-[9px] font-medium transition-colors"
                    style={{
                      background: pageMode === mode ? '#7c3aed' : 'transparent',
                      color: pageMode === mode ? '#fff' : '#aaa',
                    }}>
                    {mode === 'auto' ? 'Auto' : `${mode} Page`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


/* ═══════════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

const SectionHeading = ({ children }) => (
  <h2 className="font-bold uppercase tracking-widest" style={{ borderBottom: '1px solid #999', color: '#1a1a1a', fontSize: '11px', paddingBottom: '3px', marginBottom: '6px' }}>{children}</h2>
);

/* ── Skills Renderer: Detects "Category: item1, item2" pattern and renders as labelled rows.
   Falls back to flat tags for non-categorised skills. */
const SkillsRenderer = ({ skills, editable, onEdit, editingField, editValue, startInlineEdit, commitInlineEdit, handleInlineKeyDown, setEditValue, isEditing }) => {
  const filtered = skills.filter(s => s.trim());
  // Detect if skills use "Category: items" pattern
  const hasCategoryPattern = filtered.some(s => s.includes(':'));

  if (hasCategoryPattern) {
    return (
      <div style={{ fontSize: '10px', lineHeight: '1.45' }}>
        {filtered.map((skillLine, i) => {
          const colonIdx = skillLine.indexOf(':');
          if (colonIdx > 0) {
            const category = skillLine.slice(0, colonIdx).trim();
            const items = skillLine.slice(colonIdx + 1).trim();
            return (
              <div key={i} style={{ marginBottom: '3px' }}>
                <span style={{ fontWeight: 'bold', color: '#1a1a1a' }}>{category}: </span>
                <span style={{ color: '#333' }}>{items}</span>
              </div>
            );
          }
          // Fallback: no colon, just render as text
          return <div key={i} style={{ marginBottom: '3px', color: '#333' }}>{skillLine}</div>;
        })}
      </div>
    );
  }

  // Flat tag rendering for non-categorised skills
  return (
    <div className="flex flex-wrap gap-1">
      {filtered.map((skill, i) => (
        <span key={i} className="px-2 py-0.5 bg-gray-100 rounded" style={{ color: '#333', fontSize: '10px' }}>{skill}</span>
      ))}
    </div>
  );
};

/* ── Page 2 Overflow: renders ONLY the sections that didn't fit on page 1.
   Uses `sections` prop from DOM measurement (expStart, showEdu, showSkills, showCerts).
   NO header/name duplication — starts directly with content. */
const Page2Overflow = ({ cvData, sections }) => {
  const { expStart, showEdu, showSkills, showCerts } = sections;
  const validExp = cvData.experience.filter(e => e.role || e.company || e.dates || e.bullets.some(b => b.trim()));
  const remainingExp = validExp.slice(expStart);
  const certsFiltered = cvData.certifications.filter(c => c.trim());
  const hasAnything = remainingExp.length > 0 || showEdu || showSkills || showCerts;

  return (
    <>
      {/* Remaining experience entries */}
      {remainingExp.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <SectionHeading>{expStart > 0 ? 'Experience (continued)' : 'Experience'}</SectionHeading>
          {remainingExp.map((exp, i) => (
            <div key={i} style={{ marginBottom: '8px' }}>
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="font-bold" style={{ color: '#1a1a1a', fontSize: '11px' }}>{exp.role}</p>
                  {exp.company && exp.company !== 'Project' && <p className="italic" style={{ color: '#444', fontSize: '10px' }}>{exp.company}{exp.location ? `, ${exp.location}` : ''}</p>}
                </div>
                {exp.dates && <span className="flex-shrink-0 ml-2 font-medium" style={{ color: '#555', fontSize: '10px' }}>{exp.dates}</span>}
              </div>
              {exp.bullets.filter(b => b.trim()).length > 0 && (
                <ul style={{ marginTop: '2px', marginLeft: '10px' }}>
                  {exp.bullets.filter(b => b.trim()).map((b, bi) => (
                    <li key={bi} className="pl-2.5 relative" style={{ listStyle: 'none', color: '#333', fontSize: '10px', lineHeight: '1.35' }}>
                      <span className="absolute left-0" style={{ color: '#555' }}>•</span>{b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {showEdu && cvData.education.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <SectionHeading>Education</SectionHeading>
          {cvData.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '5px' }}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold" style={{ color: '#1a1a1a', fontSize: '11px' }}>{edu.institution}</p>
                  <p className="italic" style={{ color: '#444', fontSize: '10px' }}>{edu.degree}{edu.grade ? ` — ${edu.grade}` : ''}</p>
                </div>
                {edu.dates && <span className="flex-shrink-0 ml-2 font-medium" style={{ color: '#555', fontSize: '10px' }}>{edu.dates}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showSkills && cvData.skills.filter(s => s.trim()).length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <SectionHeading>Skills</SectionHeading>
          <SkillsRenderer skills={cvData.skills} />
        </div>
      )}

      {showCerts && certsFiltered.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <SectionHeading>Certifications & Awards</SectionHeading>
          <ul style={{ marginLeft: '10px' }}>
            {certsFiltered.map((cert, i) => (
              <li key={i} className="pl-2.5 relative" style={{ listStyle: 'none', color: '#333', fontSize: '10px', lineHeight: '1.35' }}>
                <span className="absolute left-0" style={{ color: '#555' }}>•</span>{cert}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!hasAnything && (
        <div className="flex items-center justify-center h-32 text-center">
          <p className="text-[10px] italic" style={{ color: '#999' }}>All content fits on page 1.</p>
        </div>
      )}
    </>
  );
};

const EditorSection = ({ title, icon, expanded, onToggle, children }) => (
  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
    <button onClick={onToggle} className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-900">
        <span className="text-purple-600">{icon}</span>{title}
      </div>
      {expanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
    </button>
    <AnimatePresence>
      {expanded && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
          <div className="px-3 pb-3">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const FieldInput = ({ label, value, onChange, icon, className = '' }) => (
  <div className={className}>
    <label className="block font-medium text-gray-500 mb-0.5 text-[10px]">{label}</label>
    <div className="relative">
      {icon && <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>}
      <input type="text" value={value || ''} onChange={e => onChange(e.target.value)}
        className={`w-full border border-gray-200 rounded outline-none focus:ring-1 focus:ring-purple-200 focus:border-purple-400 px-2 py-1 text-[11px] ${icon ? 'pl-6' : ''}`} />
    </div>
  </div>
);


/* ═══════════════════════════════════════════════════════════════════════════
   HTML GENERATOR (for download/print)
   ═══════════════════════════════════════════════════════════════════════════ */

const generateATSHtml = (data) => {
  const { personal, summary, experience, education, skills, certifications } = data;
  const esc = (s) => (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(personal.fullName)} - CV</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Georgia,'Times New Roman',serif;font-size:10.5pt;line-height:1.35;color:#1a1a1a;max-width:780px;margin:0 auto;padding:28px 36px}
h1{font-size:18pt;text-align:center;text-transform:uppercase;letter-spacing:3px;margin-bottom:3px}
.sub{text-align:center;color:#555;font-size:10pt;margin-bottom:5px}
.contact{text-align:center;font-size:8.5pt;color:#555;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid #1a1a1a}
.contact span{margin:0 4px}
h2{font-size:9pt;text-transform:uppercase;letter-spacing:2px;border-bottom:1px solid #444;padding-bottom:2px;margin:10px 0 5px}
.entry{margin-bottom:7px;page-break-inside:avoid}
.eh{display:flex;justify-content:space-between;align-items:flex-start}
.role{font-weight:bold;font-size:10pt}
.dates{font-size:8.5pt;color:#666;flex-shrink:0;margin-left:10px}
.co{font-style:italic;color:#555;font-size:9pt}
ul{margin:2px 0 0 15px}li{font-size:9pt;margin-bottom:1px;line-height:1.3}
.sk{display:flex;flex-wrap:wrap;gap:4px}.st{background:#f0f0f0;padding:1px 6px;border-radius:3px;font-size:8.5pt}
@page{size:A4;margin:12mm 16mm}
@media print{body{padding:0;max-width:none}html{height:564mm;overflow:hidden}}
</style></head><body>
<h1>${esc(personal.fullName)}</h1>
${personal.title?`<div class="sub">${esc(personal.title)}</div>`:''}
<div class="contact">${[personal.email,personal.phone,personal.location,personal.linkedin,personal.website].filter(Boolean).map(c=>`<span>${esc(c)}</span>`).join(' | ')}</div>
${summary?`<h2>Professional Summary</h2><p style="font-size:9pt;color:#333;line-height:1.35">${esc(summary)}</p>`:''}
${experience.length?`<h2>Experience</h2>${experience.map(x=>`<div class="entry"><div class="eh"><div><div class="role">${esc(x.role)}</div><div class="co">${esc(x.company)}${x.location?`, ${esc(x.location)}`:''}</div></div>${x.dates?`<div class="dates">${esc(x.dates)}</div>`:''}</div>${x.bullets.filter(b=>b.trim()).length?`<ul>${x.bullets.filter(b=>b.trim()).map(b=>`<li>${esc(b)}</li>`).join('')}</ul>`:''}</div>`).join('')}`:''}
${education.length?`<h2>Education</h2>${education.map(x=>`<div class="entry"><div class="eh"><div><div class="role">${esc(x.institution)}</div><div class="co">${esc(x.degree)}${x.grade?` — ${esc(x.grade)}`:''}</div></div>${x.dates?`<div class="dates">${esc(x.dates)}</div>`:''}</div></div>`).join('')}`:''}
${skills.filter(s=>s.trim()).length?`<h2>Skills</h2><div class="sk">${skills.filter(s=>s.trim()).map(s=>`<span class="st">${esc(s)}</span>`).join('')}</div>`:''}
${certifications.filter(c=>c.trim()).length?`<h2>Certifications & Awards</h2><ul>${certifications.filter(c=>c.trim()).map(c=>`<li>${esc(c)}</li>`).join('')}</ul>`:''}
</body></html>`;
};

export default ATSCVBuilder;
