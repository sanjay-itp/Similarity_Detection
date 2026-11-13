// Demo data used only when VITE_USE_MOCK=true.

const essayBase =
  'Academic integrity is the foundation of trust in any learning community. When students submit work that is their own, ' +
  'teachers can measure real progress and give feedback that actually helps. Copying another person\'s work hides what a ' +
  'student does not understand, so the gap grows larger with every assignment. Universities protect integrity through clear ' +
  'rules, honest assessment, and tools that compare submissions for unusual overlap. These tools do not prove misconduct on ' +
  'their own; they point a teacher toward passages that deserve a closer look. The final judgement always belongs to a person ' +
  'who can read both documents and consider the context.';

export const seedTexts = {
  s1:
    essayBase +
    ' In my view the most important step is teaching students how to cite sources properly from their first semester, because ' +
    'many cases of plagiarism start as confusion rather than an intention to cheat.',
  s2:
    'Academic integrity is the foundation of trust in any learning community. When students submit work that is their own, ' +
    'teachers can measure real progress and give feedback that actually helps. Copying another person\'s work hides what a ' +
    'student does not understand, so the gap grows larger with every assignment. Schools enforce this with honor codes and ' +
    'software that compares submissions for unusual overlap. These tools do not prove misconduct on their own; they point a ' +
    'teacher toward passages that deserve a closer look. I believe deadlines and pressure are the main reasons students copy.',
  s3:
    'Honesty in coursework matters because grades are supposed to describe what a learner can do. If an essay is borrowed, the ' +
    'grade describes someone else. Software that compares submissions for unusual overlap can help a busy teacher, but it ' +
    'should never replace reading the work. Context matters: two students who studied together may use similar phrases ' +
    'without copying. Good assessment design, such as asking for personal reflection, makes copying harder and less tempting.',
  s4:
    'Plagiarism detection in local networks has practical advantages. Student files never leave the institution, which helps ' +
    'with privacy rules, and the system keeps working even when the internet is slow. The trade off is that the database only ' +
    'contains work submitted at that institution, so copying from the web may go unnoticed unless teachers add reference ' +
    'documents. A clear report with side by side highlights saves the most time during review.',
  s5:
    'Every learning community depends on trust. Students who hand in original work let teachers see their real progress and ' +
    'respond with useful feedback. In my experience, most students who copy are overwhelmed rather than dishonest, so ' +
    'institutions should pair detection with support: writing centres, flexible deadlines, and early lessons on citation. ' +
    'A detection score alone tells us very little without a human reading the flagged passages.',
};

const now = Date.now();
const day = 24 * 60 * 60 * 1000;
const iso = (offsetDays) => new Date(now + offsetDays * day).toISOString();

export function buildSeed() {
  return {
    setupDone: true,
    nextId: 1000,
    settings: {
      institutionName: 'Demo Institute of Technology',
      similarityThreshold: 40,
      allowedFileTypes: ['.pdf', '.docx', '.txt'],
      maxFileSizeMb: 10,
      allowStudentRegistration: true,
      ngramSize: 5,
    },
    users: [
      { id: 'u1', role: 'admin', name: 'System Administrator', email: 'admin@integritycheck.local', password: 'admin123', active: true, createdAt: iso(-60) },
      { id: 'u2', role: 'teacher', name: 'Dr. Anita Sharma', email: 'teacher@integritycheck.local', password: 'teacher123', department: 'Computer Science', active: true, createdAt: iso(-50) },
      { id: 'u3', role: 'teacher', name: 'Mr. Ramesh Karki', email: 'ramesh@integritycheck.local', password: 'teacher123', department: 'Humanities', active: true, createdAt: iso(-45) },
      { id: 'u10', role: 'student', name: 'Sita Thapa', email: 'student@integritycheck.local', password: 'student123', studentId: 'CS-2023-014', active: true, createdAt: iso(-40) },
      { id: 'u11', role: 'student', name: 'Bikash Rai', email: 'bikash@integritycheck.local', password: 'student123', studentId: 'CS-2023-021', active: true, createdAt: iso(-39) },
      { id: 'u12', role: 'student', name: 'Priya Gurung', email: 'priya@integritycheck.local', password: 'student123', studentId: 'CS-2023-007', active: true, createdAt: iso(-38) },
      { id: 'u13', role: 'student', name: 'Aarav Shrestha', email: 'aarav@integritycheck.local', password: 'student123', studentId: 'CS-2023-033', active: true, createdAt: iso(-37) },
      { id: 'u14', role: 'student', name: 'Maya Tamang', email: 'maya@integritycheck.local', password: 'student123', studentId: 'CS-2023-002', active: false, createdAt: iso(-36) },
    ],
    courses: [
      { id: 'c1', code: 'CS301', name: 'Software Engineering', teacherId: 'u2', joinCode: 'SE-4821', studentIds: ['u10', 'u11', 'u12', 'u13', 'u14'] },
      { id: 'c2', code: 'CS210', name: 'Database Systems', teacherId: 'u2', joinCode: 'DB-1177', studentIds: ['u10', 'u12'] },
      { id: 'c3', code: 'HU105', name: 'Academic Writing', teacherId: 'u3', joinCode: 'AW-3009', studentIds: ['u11', 'u13'] },
    ],
    assignments: [
      {
        id: 'a1', courseId: 'c1', title: 'Essay: Academic Integrity in the Digital Age',
        description: 'Write a 300 to 500 word essay on why academic integrity matters and how institutions should protect it. Submit as PDF, DOCX or TXT.',
        dueDate: iso(-2), allowedFileTypes: ['.pdf', '.docx', '.txt'], createdAt: iso(-14),
      },
      {
        id: 'a2', courseId: 'c1', title: 'Project Proposal: Local Plagiarism Checker',
        description: 'Describe the architecture of a plagiarism checker that runs on a local network. Include a diagram.',
        dueDate: iso(5), allowedFileTypes: ['.pdf', '.docx'], createdAt: iso(-3),
      },
      {
        id: 'a3', courseId: 'c2', title: 'ER Diagram and Normalisation',
        description: 'Design an ER diagram for a library system and normalise it to 3NF.',
        dueDate: iso(10), allowedFileTypes: ['.pdf'], createdAt: iso(-1),
      },
    ],
    submissions: [
      { id: 'sub1', assignmentId: 'a1', studentId: 'u10', fileName: 'integrity_essay_sita.docx', fileSize: 24576, submittedAt: iso(-4), text: seedTexts.s1, status: 'checked' },
      { id: 'sub2', assignmentId: 'a1', studentId: 'u11', fileName: 'BikashRai_Essay.pdf', fileSize: 88211, submittedAt: iso(-3), text: seedTexts.s2, status: 'checked' },
      { id: 'sub3', assignmentId: 'a1', studentId: 'u12', fileName: 'essay-final.pdf', fileSize: 70421, submittedAt: iso(-3.5), text: seedTexts.s3, status: 'checked' },
      { id: 'sub4', assignmentId: 'a1', studentId: 'u13', fileName: 'aarav_integrity.txt', fileSize: 2140, submittedAt: iso(-1.5), text: seedTexts.s4, status: 'checked' },
      { id: 'sub5', assignmentId: 'a1', studentId: 'u14', fileName: 'maya_essay.docx', fileSize: 19980, submittedAt: iso(-2.5), text: seedTexts.s5, status: 'checked' },
      { id: 'sub6', assignmentId: 'a2', studentId: 'u11', fileName: 'proposal_v1.pdf', fileSize: 131072, submittedAt: iso(-0.5), text: seedTexts.s4, status: 'submitted' },
    ],
    reports: {},
    activity: [
      { id: 'act1', at: iso(-60), actor: 'System Administrator', action: 'Installed IntegrityCheck and created the admin account' },
      { id: 'act2', at: iso(-50), actor: 'System Administrator', action: 'Created teacher account for Dr. Anita Sharma' },
      { id: 'act3', at: iso(-45), actor: 'System Administrator', action: 'Created teacher account for Mr. Ramesh Karki' },
      { id: 'act4', at: iso(-2), actor: 'Dr. Anita Sharma', action: 'Ran similarity check on "Essay: Academic Integrity in the Digital Age"' },
    ],
  };
}
