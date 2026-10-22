import { normalizeUrl } from './core.js';

export const RESEARCH_CATEGORIES = ['AI 与智能科研', '文献检索', '理论与课程', '仿真与建模', '编程与数值计算', '实验与数据资源', '绘图与后处理', '论文写作与文献管理', '校园与课题组'];
export const AI_GROUPS = ['通用 AI 助手', 'AI 文献发现', 'AI 编程助手', '机器学习框架', '物理与科学机器学习', '课程与学习资料'];

// Editorial directory; independent of the user's local bookmarks.
const entries = [
  ['scholar', 'Google Scholar', 'https://scholar.google.com/', '检索学术论文，追踪引用与相关研究。', '文献检索', '', ['论文', '引用']],
  ['wos', 'Web of Science', 'https://www.webofscience.com/', '文献检索与引文分析，全文权限以学校订阅为准。', '文献检索', '', ['SCI', '引文']],
  ['cnki', '中国知网', 'https://www.cnki.net/', '检索中文期刊与学位论文，部分资源需要机构权限。', '文献检索', '', ['中文', '学位论文']],
  ['arxiv', 'arXiv', 'https://arxiv.org/', '追踪预印本；阅读时注意与正式发表版本区分。', '文献检索', '', ['预印本', '计算力学']],
  ['mit-solid', 'MIT 固体力学', 'https://ocw.mit.edu/courses/1-050-solid-mechanics-fall-2004/', '固体力学公开课，补充基础概念和学习资料。', '理论与课程', '', ['固体力学', '弹性力学']],
  ['mit-fluid', 'MIT 流体力学', 'https://ocw.mit.edu/courses/2-06-fluid-dynamics-spring-2013/', '流体力学课程资料，复习控制方程与基础理论。', '理论与课程', '', ['流体力学', '控制方程']],
  ['abaqus', 'Abaqus', 'https://www.3ds.com/products/simulia/abaqus', '非线性有限元、接触与材料行为模拟；使用需相应许可。', '仿真与建模', '', ['固体力学', '有限元', '本构']],
  ['ansys', 'Ansys Student', 'https://www.ansys.com/academic/students/ansys-student', '学生仿真资源入口，具体许可与限制以官网为准。', '仿真与建模', '', ['结构', '流体力学', '振动']],
  ['comsol', 'COMSOL 文档', 'https://www.comsol.com/documentation', '查阅多物理场建模与耦合分析文档。', '仿真与建模', '', ['多物理场', '流固耦合']],
  ['openfoam', 'OpenFOAM 文档', 'https://www.openfoam.com/documentation/', '查阅流体计算算例、边界条件与求解器说明。', '仿真与建模', '', ['流体力学', 'CFD', '湍流']],
  ['gmsh', 'Gmsh', 'https://www.gmsh.info/', '几何建模、有限元网格划分与脚本接口。', '仿真与建模', '', ['网格', '有限元']],
  ['matlab', 'MATLAB 文档', 'https://www.mathworks.com/help/', '数值计算、优化、信号处理与工具箱文档。', '编程与数值计算', '', ['动力学', '振动', '参数识别']],
  ['scipy', 'SciPy', 'https://scipy.org/', 'Python 优化、积分、特征值与微分方程算法。', '编程与数值计算', '', ['Python', '优化设计', '数值方法']],
  ['fenics', 'FEniCS', 'https://fenicsproject.org/', '用有限元方法求解偏微分方程的开源计算平台。', '编程与数值计算', '', ['计算力学', '有限元', 'PDE']],
  ['jhtdb', 'JHTDB 湍流数据库', 'https://turbulence.pha.jhu.edu/', '公开湍流数值模拟数据，用于流场分析与方法验证。', '实验与数据资源', '', ['流体力学', 'DNS', '湍流']],
  ['dic', 'NIST DIC Challenge', 'https://www.nist.gov/publications/dic-challenge-developing-images-and-guidelines-evaluating-accuracy-and-resolution-2d', '数字图像相关方法的验证图像与评估资料。', '实验与数据资源', '', ['实验力学', 'DIC', '图像处理']],
  ['zenodo', 'Zenodo', 'https://zenodo.org/', '寻找和共享研究数据、软件与其他科研产出。', '实验与数据资源', '', ['数据集', '可复现']],
  ['matplotlib', 'Matplotlib', 'https://matplotlib.org/', '制作论文曲线、统计图与可定制的科研可视化。', '绘图与后处理', '', ['Python', '论文绘图']],
  ['paraview', 'ParaView', 'https://www.paraview.org/', '分析三维场、流场与仿真计算结果。', '绘图与后处理', '', ['后处理', 'CFD', '可视化']],
  ['zotero', 'Zotero', 'https://www.zotero.org/', '收集、整理文献并管理论文引用。', '论文写作与文献管理', '', ['文献管理', '引用']],
  ['overleaf', 'Overleaf', 'https://www.overleaf.com/', '在线 LaTeX 论文、公式排版与协作写作。', '论文写作与文献管理', '', ['LaTeX', '论文写作']],
  ['chatgpt', 'ChatGPT', 'https://chatgpt.com/', '讨论力学概念、检查推导思路与辅助科研表达。', 'AI 与智能科研', '通用 AI 助手', ['概念学习', '论文润色']],
  ['claude', 'Claude', 'https://claude.ai/', '辅助阅读文本、讨论程序与修改学术表达。', 'AI 与智能科研', '通用 AI 助手', ['阅读', '代码']],
  ['gemini', 'Gemini', 'https://gemini.google.com/', '辅助梳理问题、理解资料和整理研究思路。', 'AI 与智能科研', '通用 AI 助手', ['研究思路']],
  ['deepseek', 'DeepSeek', 'https://chat.deepseek.com/', '中文概念讨论、数学思路和程序解释。', 'AI 与智能科研', '通用 AI 助手', ['中文', '推导']],
  ['semantic', 'Semantic Scholar', 'https://www.semanticscholar.org/', '发现学术论文并追踪相关研究与引用。', 'AI 与智能科研', 'AI 文献发现', ['论文', '引用']],
  ['elicit', 'Elicit', 'https://elicit.com/', '辅助发现论文、整理研究问题与文献信息。', 'AI 与智能科研', 'AI 文献发现', ['文献综述']],
  ['rabbit', 'ResearchRabbit', 'https://www.researchrabbit.ai/', '从已有论文拓展相关文献与研究网络。', 'AI 与智能科研', 'AI 文献发现', ['文献网络']],
  ['connected', 'Connected Papers', 'https://www.connectedpapers.com/', '围绕起点论文探索关联研究的图谱。', 'AI 与智能科研', 'AI 文献发现', ['文献图谱']],
  ['codex', 'Codex', 'https://openai.com/codex/', '辅助开发、检查和调试科研代码。', 'AI 与智能科研', 'AI 编程助手', ['Python', 'MATLAB', '后处理']],
  ['copilot', 'GitHub Copilot', 'https://github.com/features/copilot', '代码补全与编程辅助，适合科研脚本开发。', 'AI 与智能科研', 'AI 编程助手', ['代码补全']],
  ['cursor', 'Cursor', 'https://cursor.com/', '结合代码编辑器进行科研程序开发与调试。', 'AI 与智能科研', 'AI 编程助手', ['代码编辑器']],
  ['pytorch', 'PyTorch', 'https://pytorch.org/', '训练代理模型，进行实验数据回归与图像学习。', 'AI 与智能科研', '机器学习框架', ['参数识别', '代理模型', '实验智能分析']],
  ['jax', 'JAX', 'https://docs.jax.dev/en/latest/', '自动微分和数组计算，支持可微分数值研究。', 'AI 与智能科研', '机器学习框架', ['自动微分', '优化设计']],
  ['sklearn', 'scikit-learn', 'https://scikit-learn.org/', '回归、分类与数据预处理，建立机器学习基线。', 'AI 与智能科研', '机器学习框架', ['回归', '参数识别']],
  ['huggingface', 'Hugging Face', 'https://huggingface.co/', '查找模型、数据集与机器学习工具。', 'AI 与智能科研', '机器学习框架', ['模型', '数据集']],
  ['deepxde', 'DeepXDE', 'https://deepxde.readthedocs.io/', '物理信息神经网络、微分方程正反问题与算子学习。', 'AI 与智能科研', '物理与科学机器学习', ['PINNs', '参数识别', '反问题']],
  ['physicsnemo', 'NVIDIA PhysicsNeMo', 'https://developer.nvidia.com/physicsnemo', '物理 AI 与工程仿真代理模型框架。', 'AI 与智能科研', '物理与科学机器学习', ['代理模型', '流体力学', '固体力学']],
  ['sciml', 'SciML', 'https://sciml.ai/', '科学机器学习、可微分编程与微分方程生态。', 'AI 与智能科研', '物理与科学机器学习', ['Julia', '反问题', '可微分编程']],
  ['neuraloperator', 'NeuralOperator', 'https://neuraloperator.github.io/dev/', '神经算子与 FNO 实现，研究场到场映射。', 'AI 与智能科研', '物理与科学机器学习', ['神经算子', 'FNO', '代理模型']],
  ['d2l', '动手学深度学习', 'https://zh.d2l.ai/', '结合数学、代码与实验学习深度学习。', 'AI 与智能科研', '课程与学习资料', ['中文课程', '深度学习']],
  ['cs229', 'Stanford CS229', 'https://cs229.stanford.edu/', '机器学习课程入口与理论学习资料。', 'AI 与智能科研', '课程与学习资料', ['机器学习', '数学基础']],
  ['hylee', '李宏毅机器学习课程', 'https://speech.ee.ntu.edu.tw/~hylee/ml/', '中文机器学习与深度学习课程资源。', 'AI 与智能科研', '课程与学习资料', ['中文课程', '机器学习']],
];

export function createCatalog() {
  return entries.map(([id, title, url, description, category, subcategory, tags]) => ({
    id: `resource-${id}`, title, url: normalizeUrl(url), description, category, pinned: false,
    ...(subcategory ? { subcategory } : {}), tags: [...tags],
  }));
}
