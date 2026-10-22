import { validateJournalMetadata } from './core.js';
// Scope: mechanics and common neighbouring disciplines; not an exhaustive SCI list.
// CAS/JCR rankings stay null until year, subject and an authoritative source are checked.
const international = [
  ['jmps','Journal of the Mechanics and Physics of Solids','journal-of-the-mechanics-and-physics-of-solids','固体与材料'],
  ['ijss','International Journal of Solids and Structures','international-journal-of-solids-and-structures','固体与材料'],
  ['ijp','International Journal of Plasticity','international-journal-of-plasticity','固体与材料'],
  ['cmame','Computer Methods in Applied Mechanics and Engineering','computer-methods-in-applied-mechanics-and-engineering','计算力学'],
  ['ijie','International Journal of Impact Engineering','international-journal-of-impact-engineering','冲击与爆炸'],
  ['efm','Engineering Fracture Mechanics','engineering-fracture-mechanics','断裂与疲劳'],
  ['tafm','Theoretical and Applied Fracture Mechanics','theoretical-and-applied-fracture-mechanics','断裂与疲劳'],
  ['ijf','International Journal of Fatigue','international-journal-of-fatigue','断裂与疲劳'],
  ['ijms','International Journal of Mechanical Sciences','international-journal-of-mechanical-sciences','固体与材料'],
  ['mom','Mechanics of Materials','mechanics-of-materials','固体与材料'],
  ['mrc','Mechanics Research Communications','mechanics-research-communications','综合力学'],
  ['ijes','International Journal of Engineering Science','international-journal-of-engineering-science','综合力学'],
  ['tws','Thin-Walled Structures','thin-walled-structures','结构与稳定性'],
  ['cs','Composite Structures','composite-structures','复合材料'],
  ['cst','Composites Science and Technology','composites-science-and-technology','复合材料'],
  ['cpa','Composites Part A: Applied Science and Manufacturing','composites-part-a-applied-science-and-manufacturing','复合材料'],
  ['cpb','Composites Part B: Engineering','composites-part-b-engineering','复合材料'],
  ['cpc','Composites Part C: Open Access','composites-part-c-open-access','复合材料'],
  ['cas','Computers & Structures','computers-and-structures','计算力学'],
  ['fead','Finite Elements in Analysis and Design','finite-elements-in-analysis-and-design','计算力学'],
  ['eabe','Engineering Analysis with Boundary Elements','engineering-analysis-with-boundary-elements','计算力学'],
  ['jcp','Journal of Computational Physics','journal-of-computational-physics','计算力学'],
  ['jsv','Journal of Sound and Vibration','journal-of-sound-and-vibration','动力学与振动'],
  ['mssp','Mechanical Systems and Signal Processing','mechanical-systems-and-signal-processing','动力学与振动'],
  ['ijnlm','International Journal of Non-Linear Mechanics','international-journal-of-non-linear-mechanics','动力学与振动'],
  ['wm','Wave Motion','wave-motion','动力学与振动'],
  ['pof-elsevier','Computers & Fluids','computers-and-fluids','流体力学'],
  ['jfs','Journal of Fluids and Structures','journal-of-fluids-and-structures','流体力学'],
  ['ijmf','International Journal of Multiphase Flow','international-journal-of-multiphase-flow','流体力学'],
  ['ejma','European Journal of Mechanics - A/Solids','european-journal-of-mechanics-a-solids','固体与材料'],
  ['ejmb','European Journal of Mechanics - B/Fluids','european-journal-of-mechanics-b-fluids','流体力学'],
  ['jb','Journal of Biomechanics','journal-of-biomechanics','生物力学'],
  ['irmms','Int. Journal of Rock Mechanics and Mining Sciences','international-journal-of-rock-mechanics-and-mining-sciences','岩土力学'],
  ['cgeo','Computers and Geotechnics','computers-and-geotechnics','岩土力学'],
  ['engstruct','Engineering Structures','engineering-structures','结构与稳定性'],
  ['jnfm','Journal of Non-Newtonian Fluid Mechanics','journal-of-non-newtonian-fluid-mechanics','流变与软物质'],
  ['triboint','Tribology International','tribology-international','摩擦与接触'],
  ['wear','Wear','wear','摩擦与接触'],
  ['pem','Probabilistic Engineering Mechanics','probabilistic-engineering-mechanics','综合力学'],
  ['jweia','Journal of Wind Engineering and Industrial Aerodynamics','journal-of-wind-engineering-and-industrial-aerodynamics','流体力学'],
  ['apor','Applied Ocean Research','applied-ocean-research','海洋与流固耦合'],
  ['ocean','Ocean Engineering','ocean-engineering','海洋与流固耦合'],
].map(([id,title,slug,field]) => [id,title,`https://www.sciencedirect.com/journal/${slug}`,field]);

const springer = [
  ['am','Acta Mechanica','707','综合力学'],
  ['aam','Archive of Applied Mechanics','419','综合力学'],
  ['arma','Archive for Rational Mechanics and Analysis','205','综合力学'],
  ['cmt','Continuum Mechanics and Thermodynamics','161','固体与材料'],
  ['cm','Computational Mechanics','466','计算力学'],
  ['nd','Nonlinear Dynamics','11071','动力学与振动'],
  ['msd','Multibody System Dynamics','11044','动力学与振动'],
  ['meccanica','Meccanica','11012','综合力学'],
  ['ijfract','International Journal of Fracture','10704','断裂与疲劳'],
  ['em','Experimental Mechanics','11340','实验力学'],
  ['et','Experimental Techniques','40799','实验力学'],
  ['ef','Experiments in Fluids','348','流体力学'],
  ['ftc','Flow, Turbulence and Combustion','10494','流体力学'],
  ['tcfd','Theoretical and Computational Fluid Dynamics','162','流体力学'],
  ['bmm','Biomechanics and Modeling in Mechanobiology','10237','生物力学'],
  ['rmre','Rock Mechanics and Rock Engineering','603','岩土力学'],
  ['ag','Acta Geotechnica','11440','岩土力学'],
  ['smo','Structural and Multidisciplinary Optimization','158','结构与稳定性'],
  ['mtm','Mechanics of Time-Dependent Materials','11043','固体与材料'],
  ['rheola','Rheologica Acta','397','流变与软物质'],
  ['gm','Granular Matter','10035','颗粒与离散元'],
  ['cpm','Computational Particle Mechanics','40571','颗粒与离散元'],
  ['jpnom','Journal of Peridynamics and Nonlocal Modeling','42102','计算力学'],
  ['jelastic','Journal of Elasticity','10659','固体与材料'],
  ['zamp','Zeitschrift für angewandte Mathematik und Physik','33','综合力学'],
  ['jdbm','Journal of Dynamic Behavior of Materials','40870','冲击与爆炸'],
].map(([id,title,number,field]) => [id,title,`https://link.springer.com/journal/${number}`,field]);

const others = [
  ['jam','Journal of Applied Mechanics','https://asmedigitalcollection.asme.org/appliedmechanics','综合力学'],
  ['amr','Applied Mechanics Reviews','https://asmedigitalcollection.asme.org/appliedmechanicsreviews','综合力学'],
  ['jcn','Journal of Computational and Nonlinear Dynamics','https://asmedigitalcollection.asme.org/computationalnonlinear','动力学与振动'],
  ['jva','Journal of Vibration and Acoustics','https://asmedigitalcollection.asme.org/vibrationacoustics','动力学与振动'],
  ['jfe','Journal of Fluids Engineering','https://asmedigitalcollection.asme.org/fluidsengineering','流体力学'],
  ['jpvt','Journal of Pressure Vessel Technology','https://asmedigitalcollection.asme.org/pressurevesseltech','结构与稳定性'],
  ['jt','Journal of Tribology','https://asmedigitalcollection.asme.org/tribology','摩擦与接触'],
  ['jbe','Journal of Biomechanical Engineering','https://asmedigitalcollection.asme.org/biomechanical','生物力学'],
  ['jvvuq','Journal of Verification, Validation and Uncertainty Quantification','https://asmedigitalcollection.asme.org/verification','计算力学'],
  ['jds','Journal of Dynamic Systems, Measurement, and Control','https://asmedigitalcollection.asme.org/dynamicsystems','动力学与振动'],
  ['jfm','Journal of Fluid Mechanics','https://www.cambridge.org/core/journals/journal-of-fluid-mechanics','流体力学'],
  ['arfm','Annual Review of Fluid Mechanics','https://www.annualreviews.org/journal/fluid','流体力学'],
  ['pof','Physics of Fluids','https://pubs.aip.org/aip/pof','流体力学'],
  ['prf','Physical Review Fluids','https://journals.aps.org/fluids/','流体力学'],
  ['jasa','The Journal of the Acoustical Society of America','https://pubs.aip.org/asa/jasa','动力学与振动'],
  ['jor','Journal of Rheology','https://pubs.aip.org/sor/jor','流变与软物质'],
  ['ijnme','International Journal for Numerical Methods in Engineering','https://onlinelibrary.wiley.com/journal/10970207','计算力学'],
  ['ijnmf','International Journal for Numerical Methods in Fluids','https://onlinelibrary.wiley.com/journal/10970363','流体力学'],
  ['nag','Int. J. Numerical and Analytical Methods in Geomechanics','https://onlinelibrary.wiley.com/journal/10969853','岩土力学'],
  ['ffems','Fatigue & Fracture of Engineering Materials & Structures','https://onlinelibrary.wiley.com/journal/14602695','断裂与疲劳'],
  ['zamm','ZAMM - Journal of Applied Mathematics and Mechanics','https://onlinelibrary.wiley.com/journal/15214001','综合力学'],
  ['ijdm','International Journal of Damage Mechanics','https://journals.sagepub.com/home/jid','断裂与疲劳'],
  ['mms','Mathematics and Mechanics of Solids','https://journals.sagepub.com/home/mms','固体与材料'],
  ['sm','Soft Matter','https://pubs.rsc.org/en/journals/journalissues/sm','流变与软物质'],
  ['sms','Smart Materials and Structures','https://iopscience.iop.org/journal/0964-1726','固体与材料'],
  ['fdr','Fluid Dynamics Research','https://iopscience.iop.org/journal/1873-7005','流体力学'],
  ['ijssd','International Journal of Structural Stability and Dynamics','https://www.worldscientific.com/worldscinet/ijssd','结构与稳定性'],
  ['ijam','International Journal of Applied Mechanics','https://www.worldscientific.com/worldscinet/ijam','综合力学'],
  ['mams','Mechanics of Advanced Materials and Structures','https://www.tandfonline.com/journals/umcm20','固体与材料'],
  ['cmbbe','Computer Methods in Biomechanics and Biomedical Engineering','https://www.tandfonline.com/journals/gcmb20','生物力学'],
];

const chinese = [
  ['lxxb','力学学报','https://pubs.cstam.org.cn/lxxb','综合力学'],
  ['lxjz','力学进展','https://pubs.cstam.org.cn/lxjz','综合力学'],
  ['cjsm','固体力学学报','https://pubs.cstam.org.cn/cjsm','固体与材料'],
  ['cjcm','计算力学学报','https://pubs.cstam.org.cn/cjcm','计算力学'],
  ['lxsj','力学与实践','https://pubs.cstam.org.cn/lxsj','综合力学'],
  ['gclx','工程力学','https://engineeringmechanics.cn/','结构与稳定性'],
  ['yylx','应用力学学报','https://ocjam.xjtu.edu.cn/','综合力学'],
  ['ammcn','应用数学和力学','https://www.applmathmech.cn/','综合力学'],
  ['cqm','力学季刊','https://cqm.tongji.edu.cn/','综合力学'],
  ['bzycj','爆炸与冲击','https://www.bzycj.cn/','冲击与爆炸'],
  ['sylx','实验力学','https://sylx.ustc.edu.cn/','实验力学'],
  ['zdgc','振动工程学报','https://zdxb.nuaa.edu.cn/zdgcxb/home','动力学与振动'],
  ['zdycj','振动与冲击','https://jvs.sjtu.edu.cn/','动力学与振动'],
  ['kqdl','空气动力学学报','https://kqdlxxb.xml-journal.net/','流体力学'],
  ['sdlx','水动力学研究与进展 A 辑','https://pubs.cstam.org.cn/sdlxyjyjz','流体力学'],
  ['ytlx','岩土力学','https://ytlx.whrsm.ac.cn/','岩土力学'],
  ['yslx','岩石力学与工程学报','https://rockmech.whrsm.ac.cn/','岩土力学'],
  ['ytgc','岩土工程学报','https://www.cgejournal.com/','岩土力学'],
  ['fhcl','复合材料学报','https://fhclxb.buaa.edu.cn/','复合材料'],
  ['hkxb','航空学报','https://hkxb.buaa.edu.cn/','航空航天'],
  ['yhxb','宇航学报','https://www.yhxb.org.cn/','航空航天'],
  ['ams','Acta Mechanica Sinica','https://link.springer.com/journal/10409','综合力学'],
  ['amss','Acta Mechanica Solida Sinica','https://link.springer.com/journal/10338','固体与材料'],
  ['amme','Applied Mathematics and Mechanics (English Edition)','https://link.springer.com/journal/10483','综合力学'],
  ['taml','Theoretical and Applied Mechanics Letters','https://www.sciencedirect.com/journal/theoretical-and-applied-mechanics-letters','综合力学'],
  ['jhd','Journal of Hydrodynamics','https://link.springer.com/journal/42241','流体力学'],
  ['aoa','Advances in Aerodynamics','https://link.springer.com/journal/42774','流体力学'],
  ['aamm','Advances in Applied Mathematics and Mechanics','https://www.cambridge.org/core/journals/advances-in-applied-mathematics-and-mechanics','计算力学'],
  ['friction','Friction','https://link.springer.com/journal/40544','摩擦与接触'],
  ['deftech','Defence Technology','https://www.sciencedirect.com/journal/defence-technology','冲击与爆炸'],
];

export const JOURNAL_SOURCES = [
  { title: '中国力学期刊网', url: 'https://pubs.cstam.org.cn/' },
  { title: 'ASME 期刊目录', url: 'https://www.asme.org/publications-submissions/journals/find-journal' },
  { title: 'Elsevier 力学期刊目录', url: 'https://shop.elsevier.com/journals/subjects/physical-sciences-and-engineering/engineering-and-technology/mechanics' },
  { title: 'Springer Nature 期刊目录', url: 'https://link.springer.com/journals' },
  { title: '中科院分区表', url: 'https://www.fenqubiao.com/' },
  { title: 'JCR 官方查询', url: 'https://jcr.clarivate.com/' },
];
export function createJournals() {
  return [...international, ...springer, ...others].map(row => makeJournal(row, '海外主办')).concat(chinese.map(row => makeJournal(row, '中国主办')));
}
function makeJournal([id, title, url, field], origin) {
  const short = title === 'Journal of Verification, Validation and Uncertainty Quantification' ? 'J. Verification, Validation and Uncertainty Quantification' : title;
  return {
    id: `journal-${id}`, title: short, url, category: '文献期刊', subcategory: field,
    description: `${origin} · ${field}。收录状态和分区需按相应年度核验。`, pinned: false,
    tags: [origin, field, title.length <= 30 ? title : id.toUpperCase()],
    journal: { origin, field, cas: null, jcr: id === 'arfm' ? { zone: 'Q1', year: 2026, category: 'Mechanics', source: 'https://www.annualreviews.org/about/impact-factors', note: '2026 JCR 版本，2025 年引文数据。出版方公开排名 1/172，据此判定 Q1；不是中科院分区。' } : null },
  };
}
export function filterJournals(items, { origin = '', field = '', system = 'cas', tier = '' } = {}) {
  return items.filter(item => (!origin || item.journal?.origin === origin) && (!field || item.journal?.field === field) && (!tier || (tier === 'pending' ? !item.journal?.[system] : String(item.journal?.[system]?.zone) === tier))).sort((a,b) => {
    const value = item => item.journal?.[system] ? Number(String(item.journal[system].zone).replace('Q','')) : 9;
    return value(a) - value(b);
  });
}
export function applyJournalRankings(journals, text) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > 1000000) throw new Error('分区文件不能超过 1 MB');
  const data = JSON.parse(text);
  if (data?.version !== 1 || !Array.isArray(data.rankings) || data.rankings.length > 1000) throw new Error('分区文件格式不正确');
  const lookup = new Map(journals.map(item => [item.id, item]));
  const changes = new Map();
  for (const record of data.rankings) {
    const journal = lookup.get(record.id);
    if (!journal || changes.has(record.id)) throw new Error('分区文件存在未知或重复期刊 ID');
    changes.set(record.id, validateJournalMetadata({ ...journal.journal, ...('cas' in record ? { cas: record.cas } : {}), ...('jcr' in record ? { jcr: record.jcr } : {}) }));
  }
  return journals.map(item => changes.has(item.id) ? { ...item, journal: changes.get(item.id) } : item);
}
