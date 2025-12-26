# NextPhase Action Engine - Design Document

## Overview

The NextPhase Action Engine transforms FlowIntent from a data-rich SEO platform into an action-oriented system that guides users through complete ranking journeys. The design focuses on progressive disclosure, workflow-driven experiences, and clear actionable outcomes rather than overwhelming users with raw data.

## Architecture

### Core System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Action Engine Core                        │
├─────────────────────────────────────────────────────────────┤
│  User Mode System  │  Workflow Engine  │  Progress Tracker  │
│  - Beginner        │  - Campaign Flows │  - Skill Levels   │
│  - Practitioner    │  - Step Execution │  - Achievements   │
│  - Agency          │  - State Mgmt     │  - Metrics        │
├─────────────────────────────────────────────────────────────┤
│                    Enhanced Workflows                        │
├─────────────────────────────────────────────────────────────┤
│  Ranking Campaign  │  Link Building   │  Technical Audit   │
│  Local SEO        │  Image Generation │  Content Creation  │
├─────────────────────────────────────────────────────────────┤
│                    Intelligence Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Action Generator  │  DataForSEO Exp. │  Learning System   │
│  Priority Engine   │  Composite Tools  │  Jargon Dictionary │
├─────────────────────────────────────────────────────────────┤
│                    Enhanced UI/UX                           │
├─────────────────────────────────────────────────────────────┤
│  Action Dashboard  │  Tutorial System  │  Progress Widgets  │
│  Contextual Chat   │  Voice Interface  │  Gamification     │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. User Mode System

**Interface: `UserModeProvider`**
```typescript
interface UserMode {
  level: 'beginner' | 'practitioner' | 'agency';
  preferences: {
    showTutorials: boolean;
    jargonTooltips: boolean;
    progressTracking: boolean;
    batchOperations: boolean;
  };
  capabilities: string[];
}
```

### 2. Workflow Engine

**Interface: `WorkflowDefinition`**
```typescript
interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  category: 'campaigns' | 'technical' | 'local' | 'link-building';
  phases: WorkflowPhase[];
  estimatedTime: string;
  userModes: UserMode['level'][];
}

interface WorkflowPhase {
  id: string;
  name: string;
  steps: WorkflowStep[];
  checkpoint?: CheckpointConfig;
}
```

### 3. Action Generation System

**Interface: `ActionItem`**
```typescript
interface ActionItem {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'content' | 'technical' | 'links' | 'local' | 'aeo';
  title: string;
  impact: {
    description: string;
    metrics: {
      potentialTrafficGain?: number;
      rankingImprovement?: string;
      competitiveAdvantage?: string;
    };
  };
  steps: ActionStep[];
  verification: {
    check: string;
    expectedOutcome: string;
  };
  timeToComplete: string;
  timeToSeeResults: string;
  automatable: boolean;
  automationTool?: string;
}
```

### 4. Enhanced Image System

**Interface: `ArticleImageSet`**
```typescript
interface ArticleImageSet {
  hero: GeneratedImage;
  sections: GeneratedImage[];
  infographics: GeneratedImage[];
  social: {
    og: GeneratedImage;      // 1200x630
    twitter: GeneratedImage;  // 1200x675
    pinterest: GeneratedImage; // 1000x1500
    instagram: GeneratedImage; // 1080x1080
  };
  metadata: {
    altTexts: Map<string, string>;
    fileNames: Map<string, string>;
    captions: Map<string, string>;
  };
}
```

## Data Models

### User Progress Model
```typescript
interface UserProgress {
  userId: string;
  currentMode: UserMode['level'];
  skillLevels: {
    keywordResearch: SkillLevel;
    contentCreation: SkillLevel;
    technicalSEO: SkillLevel;
    linkBuilding: SkillLevel;
    localSEO: SkillLevel;
  };
  achievements: Achievement[];
  completedTutorials: string[];
  activeWorkflows: WorkflowInstance[];
  metrics: {
    contentCreated: number;
    keywordsRanking: number;
    linksBuilt: number;
    trafficGrowth: string;
  };
}
```

### Workflow Instance Model
```typescript
interface WorkflowInstance {
  id: string;
  definitionId: string;
  userId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'paused';
  currentPhase: string;
  currentStep: string;
  context: Record<string, any>;
  results: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: User Mode Consistency
*For any* user session, when a user mode is selected, all UI components should consistently reflect that mode's complexity level and feature availability
**Validates: Requirements 1.2, 1.3, 1.4**

### Property 2: Workflow State Integrity
*For any* workflow instance, the current phase and step should always be valid according to the workflow definition, and state transitions should preserve data integrity
**Validates: Requirements 3.1, 4.1, 5.1**

### Property 3: Action Item Prioritization
*For any* set of generated action items, the priority ordering should be consistent with impact metrics and user goals
**Validates: Requirements 7.1, 7.5**

### Property 4: Tutorial Progress Tracking
*For any* user completing tutorial steps, progress should be accurately tracked and achievements should be awarded consistently
**Validates: Requirements 2.3, 11.1, 11.2**

### Property 5: Image Generation Completeness
*For any* content analysis request, the generated image set should include all required components (hero, sections, social variants) with proper metadata
**Validates: Requirements 8.1, 8.2, 8.3**

### Property 6: DataForSEO Endpoint Integration
*For any* composite analysis request, all relevant DataForSEO endpoints should be called and results should be properly aggregated
**Validates: Requirements 9.1, 9.2, 9.5**

### Property 7: Dashboard Action Relevance
*For any* user dashboard view, displayed actions should be relevant to the user's current projects and skill level
**Validates: Requirements 10.1, 10.2**

### Property 8: Chat Context Preservation
*For any* conversational interaction, context should be maintained across messages and suggestions should be relevant to the current workflow
**Validates: Requirements 12.1, 12.5**

## Error Handling

### Workflow Error Recovery
- Automatic state persistence at each step
- Graceful degradation when external APIs fail
- User-friendly error messages with suggested actions
- Ability to resume workflows from last successful checkpoint

### Data Validation
- Input validation for all user-provided data
- API response validation with fallback strategies
- Progress tracking data integrity checks
- User mode transition validation

## Testing Strategy

### Unit Testing
- Component-level testing for UI elements
- Service-level testing for workflow engine
- API integration testing for external services
- Utility function testing for data processing

### Property-Based Testing
- Use **fast-check** library for JavaScript/TypeScript property testing
- Configure each property test to run minimum 100 iterations
- Each property test tagged with format: **Feature: nextphase-action-engine, Property {number}: {property_text}**
- Property tests verify universal behaviors across generated inputs

### Integration Testing
- End-to-end workflow execution testing
- Multi-user mode testing scenarios
- External API integration testing
- Database state consistency testing

### User Experience Testing
- Beginner mode usability testing
- Tutorial completion rate analysis
- Action completion success metrics
- Dashboard effectiveness measurement