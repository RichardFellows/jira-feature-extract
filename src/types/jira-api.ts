// JIRA Server v9.12 API Types

export interface JiraUser {
  self: string;
  accountId?: string;
  name?: string;
  key?: string;
  displayName: string;
  emailAddress?: string;
  avatarUrls: {
    '16x16': string;
    '24x24': string;
    '32x32': string;
    '48x48': string;
  };
  active: boolean;
}

export interface JiraProject {
  self: string;
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
  avatarUrls: {
    '16x16': string;
    '24x24': string;
    '32x32': string;
    '48x48': string;
  };
}

export interface JiraIssueType {
  self: string;
  id: string;
  name: string;
  subtask: boolean;
  iconUrl: string;
  description: string;
}

export interface JiraStatus {
  self: string;
  id: string;
  name: string;
  description: string;
  statusCategory: {
    self: string;
    id: number;
    key: string;
    colorName: string;
    name: string;
  };
}

export interface JiraPriority {
  self: string;
  id: string;
  name: string;
  iconUrl: string;
}

export interface JiraResolution {
  self: string;
  id: string;
  name: string;
  description: string;
}

export interface JiraComponent {
  self: string;
  id: string;
  name: string;
  description?: string;
}

export interface JiraVersion {
  self: string;
  id: string;
  name: string;
  description?: string;
  archived: boolean;
  released: boolean;
  releaseDate?: string;
}

export interface JiraComment {
  self: string;
  id: string;
  author: JiraUser;
  body: string;
  updateAuthor: JiraUser;
  created: string;
  updated: string;
  visibility?: {
    type: string;
    value: string;
  };
}

export interface JiraAttachment {
  self: string;
  id: string;
  filename: string;
  author: JiraUser;
  created: string;
  size: number;
  mimeType: string;
  content: string;
  thumbnail?: string;
}

export interface JiraWorklog {
  self: string;
  author: JiraUser;
  updateAuthor: JiraUser;
  comment?: string;
  created: string;
  updated: string;
  started: string;
  timeSpent: string;
  timeSpentSeconds: number;
  id: string;
  issueId: string;
}

export interface JiraIssueFields {
  summary: string;
  description?: string;
  issuetype: JiraIssueType;
  project: JiraProject;
  status: JiraStatus;
  priority?: JiraPriority;
  resolution?: JiraResolution;
  assignee?: JiraUser;
  reporter?: JiraUser;
  creator?: JiraUser;
  created: string;
  updated: string;
  resolutiondate?: string;
  duedate?: string;
  components?: JiraComponent[];
  fixVersions?: JiraVersion[];
  versions?: JiraVersion[];
  labels?: string[];
  environment?: string;
  comment?: {
    comments: JiraComment[];
    maxResults: number;
    total: number;
    startAt: number;
  };
  attachment?: JiraAttachment[];
  worklog?: {
    startAt: number;
    maxResults: number;
    total: number;
    worklogs: JiraWorklog[];
  };
  parent?: {
    id: string;
    key: string;
    fields: {
      summary: string;
      status: JiraStatus;
      priority?: JiraPriority;
      issuetype: JiraIssueType;
    };
  };
  subtasks?: Array<{
    id: string;
    key: string;
    fields: {
      summary: string;
      status: JiraStatus;
      priority?: JiraPriority;
      issuetype: JiraIssueType;
    };
  }>;
  issuelinks?: Array<{
    id: string;
    type: {
      id: string;
      name: string;
      inward: string;
      outward: string;
    };
    outwardIssue?: {
      id: string;
      key: string;
      fields: {
        summary: string;
        status: JiraStatus;
        priority?: JiraPriority;
        issuetype: JiraIssueType;
      };
    };
    inwardIssue?: {
      id: string;
      key: string;
      fields: {
        summary: string;
        status: JiraStatus;
        priority?: JiraPriority;
        issuetype: JiraIssueType;
      };
    };
  }>;
  // Custom fields - using index signature for flexibility
  [customField: string]: any;
}

export interface JiraIssue {
  expand: string;
  id: string;
  self: string;
  key: string;
  fields: JiraIssueFields;
  changelog?: {
    startAt: number;
    maxResults: number;
    total: number;
    histories: Array<{
      id: string;
      author: JiraUser;
      created: string;
      items: Array<{
        field: string;
        fieldtype: string;
        from?: string;
        fromString?: string;
        to?: string;
        toString?: string;
      }>;
    }>;
  };
}

export interface JiraSearchResponse {
  expand: string;
  startAt: number;
  maxResults: number;
  total: number;
  issues: JiraIssue[];
  warningMessages?: string[];
}

export interface JiraField {
  id: string;
  name: string;
  custom: boolean;
  orderable: boolean;
  navigable: boolean;
  searchable: boolean;
  clauseNames: string[];
  schema: {
    type: string;
    items?: string;
    system?: string;
    custom?: string;
    customId?: number;
  };
}

export interface JiraServerInfo {
  baseUrl: string;
  version: string;
  versionNumbers: number[];
  buildNumber: number;
  buildDate: string;
  serverTime: string;
  scmInfo: string;
  serverTitle: string;
}

export interface JiraMyself {
  self: string;
  key: string;
  accountId: string;
  name: string;
  emailAddress: string;
  avatarUrls: {
    '16x16': string;
    '24x24': string;
    '32x32': string;
    '48x48': string;
  };
  displayName: string;
  active: boolean;
  timeZone: string;
  groups: {
    size: number;
    items: Array<{
      name: string;
      self: string;
    }>;
  };
  applicationRoles: {
    size: number;
    items: any[];
  };
}