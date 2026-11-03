import { Project, ProjectFile, DepartmentClaim, EmployeeTask } from '../types/office';
import { EMPLOYEES } from '../data/employees';

export interface IngestionResult {
  project: Project;
  tasks: EmployeeTask[];
  fileCount: number;
  departmentCount: number;
}

export class FolderIngestionService {
  /**
   * Classifies a file to the best employee based on path, extension, and content
   */
  public static classifyFile(file: { name: string; path: string; snippet?: string }): {
    employeeId: string;
    category: string;
  } {
    const fullPath = (file.path || file.name).toLowerCase();
    const fileName = file.name.toLowerCase();
    const snippet = (file.snippet || '').toLowerCase();

    // 1. ADHI: Senior Website & Architecture Developer
    // Next.js, React, WebGL, 3D Canvas, CSS, Tailwind, TSX, HTML, Frontend components
    if (
      fullPath.includes('/web/') ||
      fullPath.includes('/frontend/') ||
      fullPath.includes('/src/components/') ||
      fullPath.includes('/src/pages/') ||
      fullPath.includes('/src/app/') ||
      fullPath.includes('/styles/') ||
      fullPath.includes('/ui/') ||
      fullPath.includes('/views/') ||
      fullPath.includes('/portal/') ||
      fileName.endsWith('.tsx') ||
      fileName.endsWith('.jsx') ||
      fileName.endsWith('.css') ||
      fileName.endsWith('.scss') ||
      fileName.endsWith('.vue') ||
      fileName.includes('tailwind') ||
      fileName.includes('next.config') ||
      fileName.includes('vite.config') ||
      snippet.includes('react') ||
      snippet.includes('next/image') ||
      snippet.includes('createcontext') ||
      snippet.includes('three.js') ||
      snippet.includes('canvas')
    ) {
      return { employeeId: 'adhi', category: 'Frontend & Web Architecture' };
    }

    // 2. ABBU: Lead Landing Page & Conversion (CRO) Designer
    // Landing pages, CRO, Figma, copy, hero sections, pricing calculators, A/B test funnels
    if (
      fullPath.includes('/landing/') ||
      fullPath.includes('/cro/') ||
      fullPath.includes('/figma/') ||
      fullPath.includes('/wireframes/') ||
      fullPath.includes('/mockups/') ||
      fullPath.includes('/funnel/') ||
      fullPath.includes('/hero/') ||
      fileName.includes('hero') ||
      fileName.includes('landing') ||
      fileName.includes('pricing') ||
      fileName.includes('cta') ||
      fileName.includes('wireframe') ||
      fileName.endsWith('.fig') ||
      snippet.includes('call to action') ||
      snippet.includes('conversion rate') ||
      snippet.includes('value proposition') ||
      snippet.includes('hero headline') ||
      snippet.includes('a/b test')
    ) {
      return { employeeId: 'abbu', category: 'Landing Page & Conversion (CRO)' };
    }

    // 3. PROX: Search Intelligence & Generative Engine Optimization (GEO) Lead
    // SEO, GEO, Perplexity, ChatGPT citations, keywords, robots.txt, sitemaps, JSON-LD schemas
    if (
      fullPath.includes('/seo/') ||
      fullPath.includes('/geo/') ||
      fullPath.includes('/search/') ||
      fullPath.includes('/citations/') ||
      fullPath.includes('/keywords/') ||
      fileName === 'robots.txt' ||
      fileName.includes('sitemap') ||
      fileName.includes('keywords') ||
      fileName.includes('schema') ||
      fileName.includes('perplexity') ||
      snippet.includes('json-ld') ||
      snippet.includes('schema.org') ||
      snippet.includes('meta description') ||
      snippet.includes('canonical') ||
      snippet.includes('search volume') ||
      snippet.includes('citation share')
    ) {
      return { employeeId: 'prox', category: 'Search Intelligence & GEO Engine' };
    }

    // 4. VD (VAIBAV): Head of Autonomous AI Agents & Workflows
    // Multi-agent systems, Gemini 2.0, prompts, workflows, Python scripts, automations, LangGraph
    if (
      fullPath.includes('/ai/') ||
      fullPath.includes('/agents/') ||
      fullPath.includes('/workflows/') ||
      fullPath.includes('/prompts/') ||
      fullPath.includes('/langgraph/') ||
      fullPath.includes('/gemini/') ||
      fullPath.includes('/automation/') ||
      fullPath.includes('/bots/') ||
      fileName.endsWith('.py') ||
      fileName.endsWith('.ipynb') ||
      fileName.includes('agent') ||
      fileName.includes('workflow') ||
      fileName.includes('prompt') ||
      snippet.includes('langgraph') ||
      snippet.includes('langchain') ||
      snippet.includes('gemini-2.0') ||
      snippet.includes('openrouter') ||
      snippet.includes('function_calling') ||
      snippet.includes('system_prompt')
    ) {
      return { employeeId: 'vaibav', category: 'Autonomous AI Agents & Workflows' };
    }

    // 5. TAHA: Enterprise Systems & CRM/ERP Integration Architect
    // Database schemas, PostgreSQL, migrations, HubSpot, Salesforce, Stripe, ERP, Docker
    if (
      fullPath.includes('/db/') ||
      fullPath.includes('/database/') ||
      fullPath.includes('/migrations/') ||
      fullPath.includes('/crm/') ||
      fullPath.includes('/erp/') ||
      fullPath.includes('/hubspot/') ||
      fullPath.includes('/salesforce/') ||
      fullPath.includes('/stripe/') ||
      fullPath.includes('/billing/') ||
      fileName.endsWith('.sql') ||
      fileName.endsWith('.prisma') ||
      fileName.includes('docker-compose') ||
      fileName.includes('migration') ||
      fileName.includes('schema') ||
      fileName.includes('stripe') ||
      fileName.includes('hubspot') ||
      snippet.includes('create table') ||
      snippet.includes('postgresql') ||
      snippet.includes('stripe.webhook') ||
      snippet.includes('hubspot api') ||
      snippet.includes('foreign key') ||
      snippet.includes('acid')
    ) {
      return { employeeId: 'taha', category: 'Enterprise Systems & CRM/ERP' };
    }

    // 6. REWU: visual identity and creative brand assets.
    if (['/brand/', '/branding/', '/identity/', '/creative/', '/assets/brand/'].some(part => fullPath.includes(part)) ||
        ['logo', 'brand', 'typography', 'palette', 'identity', 'creative'].some(word => fileName.includes(word)) ||
        snippet.includes('brand guidelines') || snippet.includes('visual identity')) {
      return { employeeId: 'rewaant', category: 'Design & Brand Identity' };
    }

    // 7. AMEEN: Chief Executive Officer (CEO)
    // Overview, strategy, README, roadmap, budget, vision, pitch
    if (
      fileName.includes('readme') ||
      fileName.includes('roadmap') ||
      fileName.includes('strategy') ||
      fileName.includes('overview') ||
      fileName.includes('budget') ||
      fileName.includes('pitch') ||
      fullPath.includes('/docs/') ||
      fullPath.includes('/executive/')
    ) {
      return { employeeId: 'ameen', category: 'Executive Strategy & Corporate Vision' };
    }

    // Default distribution: based on file type
    if (fileName.endsWith('.ts') || fileName.endsWith('.js') || fileName.endsWith('.json')) {
      return { employeeId: 'adhi', category: 'Frontend & Web Architecture' };
    }
    if (fileName.endsWith('.csv') || fileName.endsWith('.xlsx')) {
      return { employeeId: 'rewaant', category: 'Growth & Lead Data' };
    }
    if (fileName.endsWith('.md') || fileName.endsWith('.txt')) {
      return { employeeId: 'ameen', category: 'Project Overview & Documentation' };
    }

    return { employeeId: 'ameen', category: 'Project Assets' };
  }

  /**
   * Reads a text snippet from a browser File object (up to maxChars)
   */
  public static async readFileSnippet(file: File, maxChars = 1200): Promise<string> {
    const textExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.html', '.css', '.scss', '.md', '.txt', '.csv', '.sql', '.py', '.yml', '.yaml', '.sh', '.xml'];
    const lowerName = file.name.toLowerCase();
    const isText = textExtensions.some(ext => lowerName.endsWith(ext)) || file.type.startsWith('text/') || file.type.includes('json');

    if (!isText) {
      return `[Binary file: ${(file.size / 1024).toFixed(1)} KB]`;
    }

    return new Promise((resolve) => {
      try {
        const slice = file.slice(0, 4096);
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = (e.target?.result as string) || '';
          resolve(content.slice(0, maxChars));
        };
        reader.onerror = () => resolve('');
        reader.readAsText(slice);
      } catch {
        resolve('');
      }
    });
  }

  /**
   * Ingests a list of browser File objects (from directory upload or drag-and-drop)
   */
  public static async ingestFiles(
    fileList: FileList | File[],
    customProjectName?: string
  ): Promise<IngestionResult> {
    const files = Array.from(fileList);
    if (files.length === 0) {
      throw new Error('No files provided to ingest.');
    }

    // Determine project name from directory root or custom name
    let detectedFolder = customProjectName?.trim() || '';
    if (!detectedFolder) {
      const firstPath = (files[0] as any).webkitRelativePath || files[0].name;
      if (firstPath.includes('/')) {
        detectedFolder = firstPath.split('/')[0];
      } else {
        detectedFolder = 'Uploaded Client Project';
      }
    }

    // Format clean project name
    const projectName = detectedFolder
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());

    const projectId = `proj-${Date.now().toString(36)}`;
    const projectFiles: ProjectFile[] = [];

    // Parse all files with snippets
    for (const f of files) {
      const relPath = (f as any).webkitRelativePath || f.name;
      const snippet = await this.readFileSnippet(f);
      const { employeeId, category } = this.classifyFile({
        name: f.name,
        path: relPath,
        snippet
      });

      projectFiles.push({
        name: f.name,
        path: relPath,
        size: f.size,
        type: f.name.split('.').pop() || 'file',
        snippet,
        claimedByEmployeeId: employeeId,
        claimedCategory: category
      });
    }

    // Group files by department claim
    const claims: Record<string, DepartmentClaim> = {};

    EMPLOYEES.forEach(emp => {
      const empFiles = projectFiles.filter(f => f.claimedByEmployeeId === emp.id);

      // CEO Ameen oversees ALL files in the project
      const filesForClaim = emp.id === 'ameen' ? projectFiles : empFiles;

      let summary = '';
      let suggestedTaskTitle = '';
      let suggestedScope = '';

      switch (emp.id) {
        case 'adhi':
          summary = `Extracted ${empFiles.length} web/frontend files. Ready to architect Next.js 15 components, optimize 3D Canvas integration, and ensure 60FPS performance.`;
          suggestedTaskTitle = `Architect Web Frontend & Performance for ${projectName}`;
          suggestedScope = `Review and optimize ${empFiles.length} UI components, client portal routes, and responsive layouts.`;
          break;
        case 'abbu':
          summary = `Extracted ${empFiles.length} landing page & design assets. Ready to analyze conversion psychology, headlines, and A/B test funnels.`;
          suggestedTaskTitle = `Design High-Converting CRO Landing Strategy for ${projectName}`;
          suggestedScope = `Engineer value-proposition hooks, hero section wireframes, and pricing tiers from extracted design files.`;
          break;
        case 'prox':
          summary = `Extracted ${empFiles.length} search intelligence & SEO data files. Ready to audit Perplexity citation footprint and JSON-LD schemas.`;
          suggestedTaskTitle = `Audit Search Intelligence & GEO Footprint for ${projectName}`;
          suggestedScope = `Validate structured data schemas, commercial keyword clusters, and AI search crawler discoverability.`;
          break;
        case 'vaibav':
          summary = `Extracted ${empFiles.length} AI agent & automation files. Ready to deploy autonomous multi-agent pipelines with Gemini 2.0.`;
          suggestedTaskTitle = `Deploy Autonomous AI Agent Mesh for ${projectName}`;
          suggestedScope = `Configure multi-agent coordination, webhook ingestion triggers, and self-healing error retries.`;
          break;
        case 'taha':
          summary = `Extracted ${empFiles.length} database, CRM & systems files. Ready to configure PostgreSQL schemas, HubSpot sync, and Stripe billing.`;
          suggestedTaskTitle = `Integrate Enterprise Database Schemas & CRM Sync for ${projectName}`;
          suggestedScope = `Architect ACID-compliant table structures, webhook reconciliation, and enterprise access control.`;
          break;
        case 'rewaant':
          summary = `Extracted ${empFiles.length} design & brand identity files. Ready to develop visual direction and consistent brand assets.`;
          suggestedTaskTitle = `Launch B2B Outbound Campaigns & ICP Sequences for ${projectName}`;
          suggestedScope = `Build multi-touch email sequences, verify domain deliverability safeguards, and accelerate sales pipeline.`;
          break;
        case 'ameen':
          summary = `Overseeing all ${projectFiles.length} files across the entire project. Ready to synthesize cross-department execution roadmap.`;
          suggestedTaskTitle = `Master Executive Synthesis & Cross-Department Roadmap for ${projectName}`;
          suggestedScope = `Unite Adhi (Web), Abbu (CRO), Prox (SEO), VD (AI), Taha (Systems), and Rewu (Growth) into a unified enterprise delivery plan.`;
          break;
      }

      claims[emp.id] = {
        employeeId: emp.id,
        employeeName: emp.name,
        role: emp.title,
        fileCount: filesForClaim.length,
        files: filesForClaim,
        summary,
        suggestedTaskTitle,
        suggestedScope
      };
    });

    const project: Project = {
      id: projectId,
      name: projectName,
      client: 'Uploaded Client Project',
      description: `Project extracted from uploaded folder "${detectedFolder}" containing ${projectFiles.length} files.`,
      color: '#06B6D4',
      createdAt: new Date().toISOString(),
      folderName: detectedFolder,
      totalFiles: projectFiles.length,
      files: projectFiles,
      departmentClaims: claims
    };

    // Generate tasks for each employee
    const tasks: EmployeeTask[] = [];

    EMPLOYEES.forEach(emp => {
      const claim = claims[emp.id];
      if (!claim || claim.fileCount === 0) return;

      const fileSample = claim.files.slice(0, 5).map(f => f.path);
      const snippetsSummary = claim.files
        .filter(f => f.snippet && !f.snippet.startsWith('[Binary'))
        .slice(0, 3)
        .map(f => `--- ${f.path} ---\n${f.snippet?.slice(0, 350)}...`)
        .join('\n\n');

      tasks.push({
        id: `task-${emp.id}-${Date.now().toString(36)}`,
        employeeId: emp.id,
        projectId: project.id,
        title: claim.suggestedTaskTitle,
        taskType: `${emp.id}_folder_extraction`,
        priority: emp.id === 'ameen' ? 'urgent' : 'high',
        status: 'awaiting_connection',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        extractedFromFolder: true,
        attachedFiles: claim.files.map(f => f.path),
        briefDetails: {
          initiativeTitle: claim.suggestedTaskTitle,
          extractedFilesCount: `${claim.fileCount} files claimed from folder`,
          filePathsSample: fileSample.join(', '),
          operationalScope: claim.suggestedScope,
          codeSnippets: snippetsSummary || 'Binary or config assets'
        },
        notes: `Automatically extracted from uploaded project folder "${detectedFolder}". Ready for ${emp.name} to execute.`
      });
    });

    const departmentCount = Object.values(claims).filter(c => c.fileCount > 0).length;

    return {
      project,
      tasks,
      fileCount: projectFiles.length,
      departmentCount
    };
  }

  /**
   * Generates sample realistic project folders for 1-click testing
   */
  public static generateSampleProject(type: 'saas' | 'ecommerce' | 'agent_mesh'): IngestionResult {
    const timestamp = Date.now();

    if (type === 'saas') {
      const files: ProjectFile[] = [
        // Adhi (Web)
        { name: 'App.tsx', path: 'saas-platform/frontend/src/App.tsx', size: 3420, type: 'tsx', snippet: 'import React from "react";\nimport { Canvas } from "@react-three/fiber";\nexport function App() { return <div className="min-h-screen bg-slate-900"><Canvas /></div>; }', claimedByEmployeeId: 'adhi', claimedCategory: 'Frontend & Web Architecture' },
        { name: 'ClientDashboard.tsx', path: 'saas-platform/frontend/src/components/ClientDashboard.tsx', size: 5120, type: 'tsx', snippet: 'export function ClientDashboard({ user, metrics }) { return <div className="grid grid-cols-3 gap-4">{/* 60FPS WebGL Telemetry */}</div>; }', claimedByEmployeeId: 'adhi', claimedCategory: 'Frontend & Web Architecture' },
        { name: 'globals.css', path: 'saas-platform/frontend/styles/globals.css', size: 1450, type: 'css', snippet: '@tailwind base;\n@tailwind components;\n@tailwind utilities;\nbody { background-color: #0F172A; }', claimedByEmployeeId: 'adhi', claimedCategory: 'Frontend & Web Architecture' },

        // Abbu (CRO)
        { name: 'hero-value-prop.md', path: 'saas-platform/landing/hero-value-prop.md', size: 1890, type: 'md', snippet: '# B2B Hero Proposition\n\n**Headline**: Deploy Dedicated Enterprise AI Teams in 48 Hours.\n**Subheadline**: Cut operational overhead by 70% with autonomous workflows that self-heal.\n**CTA**: [Book Strategy Call] (+24.8% CTR)', claimedByEmployeeId: 'abbu', claimedCategory: 'Landing Page & Conversion (CRO)' },
        { name: 'pricing-matrix.json', path: 'saas-platform/landing/pricing-matrix.json', size: 980, type: 'json', snippet: '{\n  "tiers": [\n    { "name": "Starter", "price": 499, "cta": "Start Trial" },\n    { "name": "Enterprise", "price": 2499, "cta": "Deploy Dedicated Fleet" }\n  ]\n}', claimedByEmployeeId: 'abbu', claimedCategory: 'Landing Page & Conversion (CRO)' },

        // Prox (SEO / GEO)
        { name: 'robots.txt', path: 'saas-platform/seo/robots.txt', size: 280, type: 'txt', snippet: 'User-agent: *\nAllow: /\nUser-agent: PerplexityBot\nAllow: /\nUser-agent: GPTBot\nAllow: /\nSitemap: https://verlyn-saas.io/sitemap.xml', claimedByEmployeeId: 'prox', claimedCategory: 'Search Intelligence & GEO Engine' },
        { name: 'target-keywords.csv', path: 'saas-platform/seo/target-keywords.csv', size: 2150, type: 'csv', snippet: 'Keyword,Volume,CPC,Intent,PerplexityShare\nenterprise autonomous ai,18200,14.50,Commercial,68.4%\nb2b agentic workflow,9400,12.20,Commercial,72.1%\nnextjs 15 portal architecture,6100,8.40,Informational,84.0%', claimedByEmployeeId: 'prox', claimedCategory: 'Search Intelligence & GEO Engine' },

        // VD (AI Agents)
        { name: 'lead_enrichment_agent.py', path: 'saas-platform/ai/lead_enrichment_agent.py', size: 4210, type: 'py', snippet: 'from google import genai\n\nclass LeadEnrichmentMesh:\n    def __init__(self):\n        self.client = genai.Client()\n    async def enrich_prospect(self, domain: str):\n        return await self.client.models.generate_content("gemini-2.0-flash", f"Audit company {domain}")', claimedByEmployeeId: 'vaibav', claimedCategory: 'Autonomous AI Agents & Workflows' },
        { name: 'agent_mesh_pipeline.yaml', path: 'saas-platform/ai/agent_mesh_pipeline.yaml', size: 1220, type: 'yaml', snippet: 'pipeline:\n  name: Autonomous-Prospect-Mesh\n  trigger: webhook\n  retry_policy:\n    max_retries: 3\n    backoff: exponential', claimedByEmployeeId: 'vaibav', claimedCategory: 'Autonomous AI Agents & Workflows' },

        // Taha (Systems & Database)
        { name: '001_initial_schema.sql', path: 'saas-platform/db/001_initial_schema.sql', size: 3840, type: 'sql', snippet: 'CREATE TABLE organizations (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  name VARCHAR(255) NOT NULL,\n  stripe_customer_id VARCHAR(128),\n  hubspot_company_id VARCHAR(128),\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);', claimedByEmployeeId: 'taha', claimedCategory: 'Enterprise Systems & CRM/ERP' },
        { name: 'stripe_webhooks.ts', path: 'saas-platform/db/stripe_webhooks.ts', size: 2950, type: 'ts', snippet: 'export async function handleStripeWebhook(event: Stripe.Event) {\n  if (event.type === "checkout.session.completed") {\n    await syncWithHubSpot(event.data.object);\n  }\n}', claimedByEmployeeId: 'taha', claimedCategory: 'Enterprise Systems & CRM/ERP' },

        // Rewu (Outbound)
        { name: 'decision_maker_leads.csv', path: 'saas-platform/outbound/decision_maker_leads.csv', size: 6890, type: 'csv', snippet: 'Email,FirstName,Company,Title,Verified\nalex@apexfintech.com,Alex,Apex Fintech,CTO,True\nsarah@nexuscloud.io,Sarah,Nexus Cloud,VP Eng,True\nmarcus@globalscale.com,Marcus,Global Scale,Founder,True', claimedByEmployeeId: 'rewaant', claimedCategory: 'Growth & Outbound Pipeline' },
        { name: 'tier1_cold_email_sequence.md', path: 'saas-platform/outbound/tier1_cold_email_sequence.md', size: 2450, type: 'md', snippet: '### Subject: Quick observation on {{company}}\'s engineering speed\n\nHi {{firstName}},\n\nSaw you\'re scaling the product engineering team at {{company}}.\nWe built autonomous worker fleets that cut delivery time by 60% without adding headcount.\n\nWorth a 7-minute look?', claimedByEmployeeId: 'rewaant', claimedCategory: 'Growth & Outbound Pipeline' },

        // Ameen (Executive Overview)
        { name: 'README.md', path: 'saas-platform/README.md', size: 2890, type: 'md', snippet: '# SaaS Enterprise Platform 2026\n\nExecutive brief for autonomous AI enterprise scaling.\n\n- Frontend: Next.js 15 & 3D WebGL Canvas (Adhi)\n- Conversion: Figma CRO & Landing Funnels (Abbu)\n- Search: GEO Perplexity & Schema Graph (Prox)\n- AI: Gemini 2.0 Agent Mesh (VD)\n- Database: PostgreSQL & Stripe/HubSpot (Taha)\n- Growth: Multi-touch Outbound Sequences (Rewu)\n\nOverseen by Ameen (CEO).', claimedByEmployeeId: 'ameen', claimedCategory: 'Executive Strategy & Corporate Vision' }
      ];

      return this.buildResultFromFiles('SaaS Enterprise Platform', files, timestamp);
    } else {
      // E-Commerce or Agent Mesh template
      const files: ProjectFile[] = [
        { name: 'StorefrontApp.tsx', path: 'ecommerce-engine/web/StorefrontApp.tsx', size: 4120, type: 'tsx', snippet: 'export function Storefront() { return <div className="shop-grid">Next.js 15 Supercharged Shop</div>; }', claimedByEmployeeId: 'adhi', claimedCategory: 'Frontend & Web Architecture' },
        { name: 'product-hero-copy.md', path: 'ecommerce-engine/landing/product-hero-copy.md', size: 1980, type: 'md', snippet: '# High-AOV Offer\n\nTransform your storefront with instant 1-click checkouts (+38% conversion).', claimedByEmployeeId: 'abbu', claimedCategory: 'Landing Page & Conversion (CRO)' },
        { name: 'schema-products.jsonld', path: 'ecommerce-engine/seo/schema-products.jsonld', size: 1650, type: 'jsonld', snippet: '{\n  "@context": "https://schema.org/",\n  "@type": "Product",\n  "name": "Autonomous Workflow Suite"\n}', claimedByEmployeeId: 'prox', claimedCategory: 'Search Intelligence & GEO Engine' },
        { name: 'inventory_agent.py', path: 'ecommerce-engine/ai/inventory_agent.py', size: 3890, type: 'py', snippet: 'import google.genai\n# Autonomous inventory reorder predictor with zero stockout guarantees', claimedByEmployeeId: 'vaibav', claimedCategory: 'Autonomous AI Agents & Workflows' },
        { name: 'orders_database.sql', path: 'ecommerce-engine/db/orders_database.sql', size: 4500, type: 'sql', snippet: 'CREATE TABLE customer_orders ( id UUID PRIMARY KEY, total NUMERIC(12,2), status VARCHAR(32) );', claimedByEmployeeId: 'taha', claimedCategory: 'Enterprise Systems & CRM/ERP' },
        { name: 'wholesale_buyers.csv', path: 'ecommerce-engine/outbound/wholesale_buyers.csv', size: 5400, type: 'csv', snippet: 'StoreOwner,Brand,Email,AOV\nDavid,LuxeHome,david@luxe.com,$42000', claimedByEmployeeId: 'rewaant', claimedCategory: 'Growth & Outbound Pipeline' },
        { name: 'EXECUTIVE_VISION.md', path: 'ecommerce-engine/EXECUTIVE_VISION.md', size: 3100, type: 'md', snippet: '# Global Commercial Expansion Plan\n\nMulti-channel revenue deployment overseen by CEO Ameen.', claimedByEmployeeId: 'ameen', claimedCategory: 'Executive Strategy & Corporate Vision' }
      ];

      return this.buildResultFromFiles('Autonomous E-Commerce Engine', files, timestamp);
    }
  }

  private static buildResultFromFiles(projectName: string, files: ProjectFile[], timestamp: number): IngestionResult {
    const projectId = `proj-${timestamp.toString(36)}`;
    const claims: Record<string, DepartmentClaim> = {};

    EMPLOYEES.forEach(emp => {
      const empFiles = files.filter(f => f.claimedByEmployeeId === emp.id);
      const filesForClaim = emp.id === 'ameen' ? files : empFiles;

      claims[emp.id] = {
        employeeId: emp.id,
        employeeName: emp.name,
        role: emp.title,
        fileCount: filesForClaim.length,
        files: filesForClaim,
        summary: `Claimed ${filesForClaim.length} project files.`,
        suggestedTaskTitle: emp.id === 'ameen' ? `Master Executive Roadmap for ${projectName}` : `Execute ${emp.title} for ${projectName}`,
        suggestedScope: `Analyze and optimize ${filesForClaim.length} extracted files for ${projectName}.`
      };
    });

    const project: Project = {
      id: projectId,
      name: projectName,
      client: 'Internal Enterprise Workspace',
      description: `Project extracted from folder with ${files.length} structured files.`,
      color: '#3B82F6',
      createdAt: new Date().toISOString(),
      folderName: projectName.toLowerCase().replace(/\s+/g, '-'),
      totalFiles: files.length,
      files,
      departmentClaims: claims
    };

    const tasks: EmployeeTask[] = EMPLOYEES.map(emp => {
      const claim = claims[emp.id];
      return {
        id: `task-${emp.id}-${timestamp.toString(36)}`,
        employeeId: emp.id,
        projectId: project.id,
        title: claim.suggestedTaskTitle,
        taskType: `${emp.id}_folder_extraction`,
        priority: emp.id === 'ameen' ? 'urgent' : 'high',
        status: 'awaiting_connection',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        extractedFromFolder: true,
        attachedFiles: claim.files.map(f => f.path),
        briefDetails: {
          initiativeTitle: claim.suggestedTaskTitle,
          extractedFilesCount: `${claim.fileCount} files`,
          filePathsSample: claim.files.slice(0, 4).map(f => f.path).join(', '),
          operationalScope: claim.suggestedScope,
          codeSnippets: claim.files.slice(0, 2).map(f => f.snippet).join('\n---\n')
        },
        notes: `Extracted from project folder "${projectName}". Ready for execution.`
      };
    });

    return {
      project,
      tasks,
      fileCount: files.length,
      departmentCount: 7
    };
  }
}
