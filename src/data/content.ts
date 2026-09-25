export const profile = {
  name: "Abhiram Jampani",
  role: "Compiler Engineer",
  company: "NVIDIA",
  tagline:
    "I build low-level systems software — GPU compiler toolchains, change data capture for distributed databases, and high-performance C++.",
  email: "abhiramjampani7@gmail.com",
  github: "https://github.com/Abhiramjampani",
  linkedin: "https://www.linkedin.com/in/abhiram-jampani-323b37259/",
  resume: "/Abhiram_Jampani_Resume.pdf",
};

export const about = {
  paragraphs: [
    "I'm a Compiler Engineer at NVIDIA working on the CUDA toolchain. I do my best work close to the metal — binary formats, concurrency, and correctness in systems where every bug is expensive.",
    "Before joining full-time, I interned at NVIDIA on the CUDA assembler and disassembler, and at YugabyteDB on CDC (Change Data Capture) for its distributed SQL engine. I hold a B.Tech in Computer Science from IIIT Lucknow.",
  ],
  facts: [
    { label: "Current", value: "Compiler Engineer, NVIDIA" },
    { label: "Education", value: "B.Tech CSE, IIIT Lucknow · 2026" },
    { label: "Focus", value: "Compilers · Systems · Databases" },
    { label: "Based in", value: "India" },
  ],
};

export type Experience = {
  company: string;
  role: string;
  period: string;
  location: string;
  summary?: string;
  points: string[];
  link?: { label: string; href: string };
  current?: boolean;
};

export const experience: Experience[] = [
  {
    company: "NVIDIA",
    role: "Compiler Engineer",
    period: "July 2026 — Present",
    location: "India",
    current: true,
    summary:
      "Returned full-time to NVIDIA's compiler organisation, working on the CUDA compiler toolchain.",
    points: [],
  },
  {
    company: "YugabyteDB",
    role: "Software Engineer Intern",
    period: "Jan 2026 — June 2026",
    location: "India",
    points: [
      "Engineered production changes to YugabyteDB's CDC pipeline — spanning the Virtual WAL, replication slot lifecycle and the pgoutput protocol — improving data-streaming reliability for enterprise-scale distributed workloads.",
      "Strengthened CDC correctness by fixing replica identity handling, row-level publication filtering and operation-type semantics, and added a pull-mode Query API for consuming change streams.",
      "Designed cluster-wide exclusive replication slot acquisition using advisory locks with a stable name-to-integer mapping, eliminating concurrent slot conflicts in multi-tenant environments.",
    ],
    link: {
      label: "View commits",
      href: "https://github.com/yugabyte/yugabyte-db/commits/master/?author=Abhiramjampani",
    },
  },
  {
    company: "NVIDIA",
    role: "Compiler Intern",
    period: "July 2025 — Dec 2025",
    location: "India",
    points: [
      "Engineered a high-performance C++ library for NVIDIA's CUDA assembler and disassembler, exposing public APIs through a static library so external clients can integrate low-level binary analysis into their toolchains.",
      "Implemented parallel decoding with pthreads to process binary sections concurrently, achieving a 2× increase in analysis throughput on large GPU binaries.",
      "Resolved critical memory-leak and lifetime-management issues under multi-threaded execution, reducing build and integration latency by 85%.",
    ],
  },
];

export const openSource = [
  {
    name: "YugabyteDB",
    description:
      "Merged contributions to the CDC subsystem of the cloud-native distributed SQL database.",
    href: "https://github.com/yugabyte/yugabyte-db/commits/master/?author=Abhiramjampani",
    tag: "Distributed SQL",
  },
  {
    name: "LLVM",
    description:
      "Contributions to the LLVM compiler infrastructure — the foundation of modern compiler toolchains.",
    href: "https://github.com/llvm/llvm-project",
    tag: "Compilers",
  },
  {
    name: "BitcoinFuzz",
    description:
      "Contributions to differential fuzzing of Bitcoin protocol implementations and cryptography libraries.",
    href: "https://github.com/bitcoinfuzz/bitcoinfuzz",
    tag: "Fuzzing · Security",
  },
];

export type Project = {
  name: string;
  subtitle: string;
  description: string;
  stack: string[];
  github?: string;
  live?: string;
};

export const projects: Project[] = [
  {
    name: "FarmChain",
    subtitle: "Farm-to-consumer traceability",
    description:
      "A full-stack food traceability platform with QR-based product verification, JWT + OTP authentication, and Solidity smart contracts on Polygon with IPFS for immutable record anchoring and escrow payments.",
    stack: ["Next.js", "Node.js", "GraphQL", "MongoDB", "Solidity", "Polygon", "Kafka"],
    github: "https://github.com/Abhiramjampani/farm_chain_myrepo",
    live: "https://farm-chain-myrepo.vercel.app",
  },
  {
    name: "ConnectExpress",
    subtitle: "Railway route optimiser",
    description:
      "A railway search platform whose custom C++ N-API addon computes direct and multi-leg journeys with a meet-in-the-middle algorithm, delivering millisecond-scale route synthesis backed by a Redis cache-aside layer.",
    stack: ["C++", "N-API", "Node.js", "Next.js", "MongoDB", "Redis"],
    github: "https://github.com/TechWizard9999/Connect-Express",
  },
  {
    name: "MediShare",
    subtitle: "AI-assisted medicine redistribution",
    description:
      "An AI and OCR-powered platform that reduces medical waste by enabling the verified redistribution of unused, sealed medicines to those who need them.",
    stack: ["React", "Node.js", "OCR", "Google Vision", "MongoDB"],
    github: "https://github.com/Abhiramjampani/MediShare",
    live: "https://medishare-codeforge-hackathon.vercel.app/",
  },
];

export const skills = [
  {
    group: "Languages",
    items: ["C++", "C", "CUDA", "Python", "Go", "Java", "TypeScript", "JavaScript", "SQL"],
  },
  {
    group: "Systems & Compilers",
    items: ["LLVM", "GPU Toolchains", "Multithreading", "pthreads", "Linux", "GDB", "CMake"],
  },
  {
    group: "Databases",
    items: ["PostgreSQL", "YugabyteDB", "CDC", "MongoDB", "MySQL", "Redis"],
  },
  {
    group: "Web & Cloud",
    items: ["React", "Next.js", "Node.js", "Express", "FastAPI", "Docker", "AWS", "GCP", "CI/CD"],
  },
];

export const competitive = [
  { platform: "LeetCode", rating: 2139, title: "Guardian", href: "https://leetcode.com/u/Illuminati07/" },
  { platform: "CodeChef", rating: 2010, title: "5 Star", href: "https://www.codechef.com/users/abhiramjampani" },
  { platform: "Codeforces", rating: 1554, title: "Specialist", href: "https://codeforces.com/profile/illuminati0_7" },
];

export const education = {
  school: "Indian Institute of Information Technology, Lucknow",
  degree: "Bachelor of Technology — Computer Science",
  period: "Nov 2022 — July 2026",
  coursework: ["Data Structures", "Object-Oriented Programming", "Operating Systems", "Database Management Systems"],
};

export const leadership = [
  {
    title: "Overall Coordinator — Equinox",
    org: "Techno-Cultural Fest, IIIT Lucknow",
    detail: "Directed 100+ events and coordinated 30+ student clubs end-to-end.",
  },
  {
    title: "Winner — Hack-O-Fiesta V4.0",
    org: "IIIT Lucknow",
    detail: "First place at the institute's flagship hackathon.",
  },
];
