#!/usr/bin/env tsx
/**
 * git-log-ai.ts — Git 로그 AI CLI 도구
 * 
 * 특징:
 * - 로컬 레포지토리 경로 입력으로 어디서든 로그 확인
 * - 웹 서버 모드 지원
 * - 사용자 친화적인 인터페이스
 * 
 * 사용 예시:
 *   # CLI 모드
 *   npx ts-node git-log-ai.ts --repo /path/to/repo --author xxxx@gmail.com
 *   
 *   # 웹 서버 모드
 *   npx ts-node git-log-ai.ts --web --port 3000
 */

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

interface CliArgs {
  repo?: string;
  author?: string;
  since?: string;
  web?: boolean;
  port?: number;
  help?: boolean;
  analyze?: boolean;
}

interface CommitInfo {
  hash: string;
  date: string;
  author: string;
  email: string;
  subject: string;
  body: string;
}

interface ResumeAnalysis {
  summary: string;
  keyAchievements: string[];
  technicalSkills: string[];
  businessImpact: string[];
  problemSolving: string[];
  leadership: string[];
}

// --------------------------- 유틸리티 함수 ---------------------------
function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {};
  
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => argv[++i];
    
    switch (arg) {
      case "--repo":
        args.repo = next();
        break;
      case "--author":
        args.author = next();
        break;
      case "--since":
        args.since = next();
        break;
      case "--web":
        args.web = true;
        break;
      case "--port":
        args.port = parseInt(next());
        break;
      case "--analyze":
        args.analyze = true;
        break;
      case "-h":
      case "--help":
        args.help = true;
        break;
    }
  }
  
  return args;
}

function printHelp() {
  console.log(`
Git Log AI CLI 도구

사용법:
  npx ts-node git-log-ai.ts [옵션]

옵션:
  --repo <path>        Git 로컬 레포지토리 경로
  --author <email>     작성자 이메일 (기본: xxxx@gmail.com)
  --since <date>       시작 날짜 (기본: 2023-05-01)
  --web                웹 서버 모드로 실행
  --port <number>      웹 서버 포트 (기본: 3000)
  --analyze            GPT로 커밋 로그 분석 (이력서용)
  -h, --help           도움말 표시

예시:
  # CLI 모드
  npx ts-node git-log-ai.ts --repo /path/to/repo --author xxxx@gmail.com
  
  # 웹 서버 모드
  npx ts-node git-log-ai.ts --web --port 3000
`);
}

function validateRepo(repoPath: string): boolean {
  if (!existsSync(repoPath)) {
    console.error(`❌ 레포지토리 경로가 존재하지 않습니다: ${repoPath}`);
    return false;
  }
  
  const gitDir = join(repoPath, '.git');
  if (!existsSync(gitDir)) {
    console.error(`❌ Git 레포지토리가 아닙니다: ${repoPath}`);
    return false;
  }
  
  return true;
}

function runGitCommand(repoPath: string, command: string[]): string {
  try {
    return execSync(`git ${command.join(' ')}`, {
      cwd: repoPath,
      encoding: 'utf8'
    });
  } catch (error) {
    throw new Error(`Git 명령어 실행 실패: ${error}`);
  }
}

function fetchGitLog(repoPath: string, author: string, since: string): CommitInfo[] {
  const command = [
    'log',
    `--author="${author}"`,
    `--since="${since}"`,
    '--pretty=format:"%H%x09%ad%x09%an%x09%ae%x09%s%x09%b"',
    '--date=short'
  ];
  
  const output = runGitCommand(repoPath, command);
  
  return output
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      const parts = line.split('\t');
      const [hash, date, name, email, subject, ...bodyParts] = parts;
      const body = bodyParts.join('\t').trim();
      
      return {
        hash: hash || '',
        date: date || '',
        author: name || '',
        email: email || '',
        subject: subject || '',
        body: body || ''
      };
    })
    .filter(commit => {
      // 기본 필수 필드 검증
      if (!commit.hash || !commit.date || !commit.author || !commit.subject) {
        return false;
      }
      
      // 제목이 너무 짧은 경우 제외 (3자 미만)
      if (commit.subject.trim().length < 3) {
        return false;
      }
      
      // 작성자나 이메일이 비어있는 경우 제외
      if (!commit.author.trim() || !commit.email.trim()) {
        return false;
      }
      
      // 의미없는 패턴 제외
      const subject = commit.subject.toLowerCase().trim();
      const meaninglessPatterns = [
        '^$',  // 완전히 빈 문자열
        '^\\s*$',  // 공백만 있는 문자열
        '^\\*\\s*$',  // "* " 만 있는 경우
        '^feat:\\s*$',  // "feat: " 만 있는 경우
        '^fix:\\s*$',   // "fix: " 만 있는 경우
        '^chore:\\s*$', // "chore: " 만 있는 경우
        '^docs:\\s*$',  // "docs: " 만 있는 경우
        '^style:\\s*$', // "style: " 만 있는 경우
        '^refactor:\\s*$', // "refactor: " 만 있는 경우
        '^test:\\s*$'   // "test: " 만 있는 경우
      ];
      
      // 의미없는 패턴 체크
      const isMeaningless = meaninglessPatterns.some(pattern => {
        const regex = new RegExp(pattern);
        return regex.test(subject);
      });
      
      if (isMeaningless) {
        return false;
      }
      
      return true;
    });
}

function formatCommitOutput(commits: CommitInfo[]): string {
  if (commits.length === 0) {
    return "📝 해당 조건에 맞는 커밋이 없습니다.";
  }
  
  let output = `📊 총 ${commits.length}개의 커밋을 찾았습니다:\n\n`;
  
  commits.forEach((commit, index) => {
    output += `📅 ${commit.date}\n`;
    output += `👤 ${commit.author} (${commit.email})\n`;
    output += `🔗 ${commit.hash.slice(0, 7)}\n`;
    output += `📝 ${commit.subject}\n`;
    if (commit.body) {
      output += `📄 ${commit.body}\n`;
    }
    output += '\n' + '─'.repeat(50) + '\n\n';
  });
  
  return output;
}

// --------------------------- 프로젝트 컨텍스트 함수 ---------------------------
async function getProjectContext(): Promise<string> {
  try {
    // package.json에서 프로젝트 정보 추출
    const packageJsonPath = join(process.cwd(), 'package.json');
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(execSync('cat package.json', { encoding: 'utf8' }));
      
      const context = `프로젝트명: ${packageJson.name || 'Unknown'}
설명: ${packageJson.description || 'No description'}
주요 의존성: ${Object.keys(packageJson.dependencies || {}).slice(0, 10).join(', ')}
개발 의존성: ${Object.keys(packageJson.devDependencies || {}).slice(0, 5).join(', ')}`;
      
      return context;
    }
  } catch (error) {
    console.log('⚠️ 프로젝트 컨텍스트를 가져올 수 없습니다.');
  }
  
  return "프로젝트 컨텍스트를 가져올 수 없습니다.";
}

// --------------------------- GPT 분석 기능 ---------------------------
async function analyzeCommitsWithGPT(commits: CommitInfo[]): Promise<ResumeAnalysis> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY 환경변수가 설정되지 않았습니다.');
  }

  // 프로젝트 컨텍스트 가져오기
  const projectContext = await getProjectContext();
  console.log(`📋 프로젝트 컨텍스트: ${projectContext.substring(0, 100)}...`);

  // 배치 크기 설정 (토큰 제한을 고려하여)
  const batchSize = 20;
  const batches: CommitInfo[][] = [];
  
  // 커밋을 배치로 나누기
  for (let i = 0; i < commits.length; i += batchSize) {
    batches.push(commits.slice(i, i + batchSize));
  }

  console.log(`📊 총 ${commits.length}개 커밋을 ${batches.length}개 배치로 나누어 분석합니다.`);

  // 각 배치를 분석
  const batchAnalyses: ResumeAnalysis[] = [];
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`🤖 배치 ${i + 1}/${batches.length} 분석 중... (${batch.length}개 커밋)`);
    
    const batchAnalysis = await analyzeBatch(batch, i + 1, batches.length, projectContext);
    batchAnalyses.push(batchAnalysis);
    
    // API 호출 간격 조절 (Rate limiting 방지)
    if (i < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // 모든 배치 분석 결과를 통합
  return mergeBatchAnalyses(batchAnalyses);
}

async function analyzeBatch(batch: CommitInfo[], batchNum: number, totalBatches: number, projectContext: string): Promise<ResumeAnalysis> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // 커밋 메시지 포맷팅
  const commitsText = batch.map(commit => {
    const subject = commit.subject.substring(0, 100);
    const body = commit.body ? commit.body.substring(0, 150) : '';
    return `[${commit.date}] ${subject}${body ? `\n  ${body}` : ''}`;
  }).join('\n\n');

  // 본인이 원하는 방향으로 prompt를 수정하여 출력값을 변경할 수 있습니다.
  const prompt = `당신은 시니어 개발자 채용담당자입니다. 다음 Git 커밋 로그를 분석하여 이력서용 경험을 정리해주세요.

프로젝트 컨텍스트:
${projectContext}

커밋 로그 (배치 ${batchNum}/${totalBatches}):
${commitsText}

분석 기준:
- 기술적 깊이와 복잡성 강조
- 비즈니스 임팩트와 수치화된 성과 포함
- 문제 해결 과정과 의사결정 근거 설명
- 팀 리더십과 협업 경험 구체화

JSON 형식으로 응답:
{
  "summary": "이 배치의 개발 경험을 2-3문장으로 요약 (기술스택, 규모, 역할 강조)",
  "keyAchievements": [
    "구체적 수치와 함께 기술적 성과 (예: 성능 40% 향상, 메모리 사용량 50% 감소)",
    "비즈니스 임팩트가 명확한 성과 (예: 사용자 이탈률 25% 감소, 매출 15% 증가)",
    "팀/조직에 기여한 성과 (예: 코드 리뷰 프로세스 도입으로 버그 60% 감소)"
  ],
  "technicalSkills": [
    "사용한 기술스택과 아키텍처 패턴",
    "성능 최적화나 확장성 관련 경험",
    "개발 도구와 프로세스 개선 경험"
  ],
  "businessImpact": [
    "사용자 경험 개선 사례와 수치",
    "운영 효율성 향상 사례",
    "비즈니스 목표 달성에 기여한 부분"
  ],
  "problemSolving": [
    "복잡한 기술적 문제 해결 과정",
    "리스크 관리와 예외 상황 대응",
    "성능 이슈나 확장성 문제 해결"
  ],
  "leadership": [
    "기획-개발 간 의사결정 과정과 기준 수립",
    "코드 품질 향상과 팀 프로세스 개선",
    "멘토링과 지식 공유 경험"
  ]
}

각 항목은 구체적이고 측정 가능한 결과를 포함하여 작성해주세요.`;

  // 본인이 원하는 방향으로 prompt를 수정하여 출력값을 변경할 수 있습니다.
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "당신은 시니어 개발자 채용담당자입니다. Git 커밋 로그를 분석하여 경험 위주의 이력서를 작성하는 전문가입니다. 기술적 세부사항과 비즈니스 임팩트를 균형있게 분석하고, 구체적인 성과와 경험을 강조합니다. 수치화된 결과와 구체적인 기술적 도전을 포함하여 작성합니다."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('GPT 응답을 받지 못했습니다.');
    }

    return JSON.parse(response);
  } catch (error) {
    throw new Error(`배치 ${batchNum} 분석 실패: ${error.message}`);
  }
}

function mergeBatchAnalyses(analyses: ResumeAnalysis[]): ResumeAnalysis {
  // 모든 배치의 결과를 통합
  const merged: ResumeAnalysis = {
    summary: analyses.map(a => a.summary).join(' '),
    keyAchievements: [] as string[],
    technicalSkills: [] as string[],
    businessImpact: [] as string[],
    problemSolving: [] as string[],
    leadership: [] as string[]
  };

  // 중복 제거하면서 통합
  analyses.forEach(analysis => {
    merged.keyAchievements.push(...analysis.keyAchievements);
    merged.technicalSkills.push(...analysis.technicalSkills);
    merged.businessImpact.push(...analysis.businessImpact);
    merged.problemSolving.push(...analysis.problemSolving);
    merged.leadership.push(...analysis.leadership);
  });

  // 중복 제거 및 정리
  merged.keyAchievements = [...new Set(merged.keyAchievements)].slice(0, 5);
  merged.technicalSkills = [...new Set(merged.technicalSkills)].slice(0, 5);
  merged.businessImpact = [...new Set(merged.businessImpact)].slice(0, 5);
  merged.problemSolving = [...new Set(merged.problemSolving)].slice(0, 5);
  merged.leadership = [...new Set(merged.leadership)].slice(0, 5);

  return merged;
}

function formatResumeAnalysis(analysis: ResumeAnalysis): string {
  let output = `# 🎯 개발 경험 분석 보고서\n\n`;
  
  output += `## 📋 요약\n${analysis.summary}\n\n`;
  
  output += `## 🏆 주요 성과\n`;
  analysis.keyAchievements.forEach((achievement, index) => {
    output += `${index + 1}. ${achievement}\n`;
  });
  output += `\n`;
  
  output += `## 💻 기술적 역량\n`;
  analysis.technicalSkills.forEach((skill, index) => {
    output += `${index + 1}. ${skill}\n`;
  });
  output += `\n`;
  
  output += `## 💼 비즈니스 임팩트\n`;
  analysis.businessImpact.forEach((impact, index) => {
    output += `${index + 1}. ${impact}\n`;
  });
  output += `\n`;
  
  output += `## 🧩 문제 해결 능력\n`;
  analysis.problemSolving.forEach((solving, index) => {
    output += `${index + 1}. ${solving}\n`;
  });
  output += `\n`;
  
  output += `## 👥 리더십 & 협업\n`;
  analysis.leadership.forEach((leadership, index) => {
    output += `${index + 1}. ${leadership}\n`;
  });
  
  return output;
}

// --------------------------- 웹 서버 기능 ---------------------------
async function startWebServer(port: number = 3000) {
  try {
    const express = await import('express');
    const app = express.default();
    
    app.use(express.default.json());
    app.use(express.default.static('public'));
    
    // API 엔드포인트
    app.post('/api/git-log', async (req, res) => {
      try {
        const { repoPath, author, since } = req.body;
        
        if (!repoPath || !author) {
          return res.status(400).json({ error: 'repoPath와 author는 필수입니다.' });
        }
        
        if (!validateRepo(repoPath)) {
          return res.status(400).json({ error: '유효하지 않은 레포지토리 경로입니다.' });
        }
        
        const commits = fetchGitLog(repoPath, author, since || '2023-05-01');
        res.json({ commits, count: commits.length });
        
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // GPT 분석 API 엔드포인트
    app.post('/api/analyze-resume', async (req, res) => {
      try {
        const { commits } = req.body;
        
        if (!commits || !Array.isArray(commits) || commits.length === 0) {
          return res.status(400).json({ error: '커밋 데이터가 필요합니다.' });
        }
        
        const analysis = await analyzeCommitsWithGPT(commits);
        const formattedAnalysis = formatResumeAnalysis(analysis);
        
        res.json({ 
          analysis, 
          formatted: formattedAnalysis,
          success: true 
        });
        
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    app.listen(port, () => {
      console.log(`🌐 웹 서버가 http://localhost:${port} 에서 실행 중입니다.`);
      console.log(`📱 브라우저에서 http://localhost:${port} 를 열어주세요.`);
    });
    
  } catch (error) {
    console.error('❌ 웹 서버 시작 실패:', error.message);
    console.log('💡 Express를 설치하려면: npm install express @types/express');
  }
}

// --------------------------- 메인 실행 ---------------------------
async function main() {
  const args = parseArgs(process.argv);
  
  if (args.help) {
    printHelp();
    return;
  }
  
  if (args.web) {
    await startWebServer(args.port);
    return;
  }
  
  // CLI 모드
  const repoPath = args.repo || process.cwd();
  const author = args.author || '';
  const since = args.since || '2023-05-01';
  
  console.log('🔍 Git 로그를 분석하는 중...\n');
  console.log(`📁 레포지토리: ${repoPath}`);
  console.log(`👤 작성자: ${author}`);
  console.log(`📅 시작일: ${since}\n`);
  
  if (!validateRepo(repoPath)) {
    process.exit(1);
  }
  
  try {
    const commits = fetchGitLog(repoPath, author, since);
    
    if (args.analyze) {
      console.log('🤖 GPT로 커밋 로그를 분석하는 중...\n');
      const analysis = await analyzeCommitsWithGPT(commits);
      const formattedAnalysis = formatResumeAnalysis(analysis);
      console.log(formattedAnalysis);
    } else {
      const output = formatCommitOutput(commits);
      console.log(output);
    }
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    process.exit(1);
  }
}

// 실행
main().catch(console.error);
