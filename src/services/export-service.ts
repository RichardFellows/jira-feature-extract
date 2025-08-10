import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { JiraIssue } from '@/types/jira-api';
import { ExportConfig, ProgressInfo } from '@/types/app';
import { XmlExporter } from './xml-exporter';

export class ExportService {
  private xmlExporter: XmlExporter;

  constructor() {
    this.xmlExporter = new XmlExporter();
  }

  /**
   * Export issues to the specified format
   */
  async export(
    issues: JiraIssue[],
    config: ExportConfig,
    onProgress?: (progress: ProgressInfo) => void
  ): Promise<void> {
    const startTime = new Date();

    if (onProgress) {
      onProgress({
        current: 0,
        total: issues.length,
        percentage: 0,
        stage: 'processing',
        message: `Starting ${config.format.toUpperCase()} export...`,
        startTime,
      });
    }

    try {
      switch (config.format) {
        case 'xml':
          await this.exportXml(issues, config, onProgress);
          break;
        case 'json':
          await this.exportJson(issues, config, onProgress);
          break;
        case 'csv':
          await this.exportCsv(issues, config, onProgress);
          break;
        default:
          throw new Error(`Unsupported export format: ${config.format}`);
      }
    } catch (error) {
      if (onProgress) {
        onProgress({
          current: 0,
          total: issues.length,
          percentage: 0,
          stage: 'error',
          message: error instanceof Error ? error.message : 'Export failed',
          startTime,
        });
      }
      throw error;
    }
  }

  /**
   * Export to XML format
   */
  private async exportXml(
    issues: JiraIssue[],
    config: ExportConfig,
    onProgress?: (progress: ProgressInfo) => void
  ): Promise<void> {
    const xmlContent = await this.xmlExporter.exportToXml(issues, config, onProgress);
    const filename = `jira-export-${new Date().toISOString().split('T')[0]}.xml`;
    this.xmlExporter.downloadXml(xmlContent, filename);
  }

  /**
   * Export to JSON format
   */
  private async exportJson(
    issues: JiraIssue[],
    config: ExportConfig,
    onProgress?: (progress: ProgressInfo) => void
  ): Promise<void> {
    const startTime = new Date();
    let processedCount = 0;

    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalIssues: issues.length,
        format: 'json',
        version: '1.0.0',
      },
      issues: [] as any[],
    };

    for (const issue of issues) {
      const processedIssue = this.processIssueForJson(issue, config);
      exportData.issues.push(processedIssue);

      processedCount++;
      if (onProgress && processedCount % 10 === 0) {
        const percentage = (processedCount / issues.length) * 100;
        const elapsed = Date.now() - startTime.getTime();
        const estimatedTotal = (elapsed / processedCount) * issues.length;
        const remaining = estimatedTotal - elapsed;

        onProgress({
          current: processedCount,
          total: issues.length,
          percentage: Math.round(percentage),
          stage: 'processing',
          message: `Processing issue ${processedCount} of ${issues.length}`,
          startTime,
          estimatedTimeRemaining: Math.round(remaining / 1000),
        });
      }
    }

    if (onProgress) {
      onProgress({
        current: processedCount,
        total: issues.length,
        percentage: 100,
        stage: 'exporting',
        message: 'Generating JSON...',
        startTime,
      });
    }

    const jsonContent = JSON.stringify(exportData, null, 2);
    const filename = `jira-export-${new Date().toISOString().split('T')[0]}.json`;
    
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
    saveAs(blob, filename);

    if (onProgress) {
      onProgress({
        current: processedCount,
        total: issues.length,
        percentage: 100,
        stage: 'complete',
        message: 'JSON export complete',
        startTime,
      });
    }
  }

  /**
   * Export to CSV format
   */
  private async exportCsv(
    issues: JiraIssue[],
    config: ExportConfig,
    onProgress?: (progress: ProgressInfo) => void
  ): Promise<void> {
    const startTime = new Date();
    let processedCount = 0;

    if (onProgress) {
      onProgress({
        current: 0,
        total: issues.length,
        percentage: 0,
        stage: 'processing',
        message: 'Preparing CSV export...',
        startTime,
      });
    }

    const csvData: any[] = [];

    for (const issue of issues) {
      const csvRow = this.processIssueForCsv(issue, config);
      csvData.push(csvRow);

      processedCount++;
      if (onProgress && processedCount % 10 === 0) {
        const percentage = (processedCount / issues.length) * 100;
        const elapsed = Date.now() - startTime.getTime();
        const estimatedTotal = (elapsed / processedCount) * issues.length;
        const remaining = estimatedTotal - elapsed;

        onProgress({
          current: processedCount,
          total: issues.length,
          percentage: Math.round(percentage),
          stage: 'processing',
          message: `Processing issue ${processedCount} of ${issues.length}`,
          startTime,
          estimatedTimeRemaining: Math.round(remaining / 1000),
        });
      }
    }

    if (onProgress) {
      onProgress({
        current: processedCount,
        total: issues.length,
        percentage: 100,
        stage: 'exporting',
        message: 'Generating CSV...',
        startTime,
      });
    }

    const csv = Papa.unparse(csvData, {
      header: true,
      delimiter: ',',
      quotes: true,
    });

    const filename = `jira-export-${new Date().toISOString().split('T')[0]}.csv`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, filename);

    if (onProgress) {
      onProgress({
        current: processedCount,
        total: issues.length,
        percentage: 100,
        stage: 'complete',
        message: 'CSV export complete',
        startTime,
      });
    }
  }

  /**
   * Process issue for JSON export
   */
  private processIssueForJson(issue: JiraIssue, config: ExportConfig): any {
    const processedIssue: any = {
      id: issue.id,
      key: issue.key,
      self: issue.self,
      summary: issue.fields.summary,
      description: issue.fields.description,
      issueType: {
        id: issue.fields.issuetype.id,
        name: issue.fields.issuetype.name,
        subtask: issue.fields.issuetype.subtask,
      },
      project: {
        id: issue.fields.project.id,
        key: issue.fields.project.key,
        name: issue.fields.project.name,
      },
      status: {
        id: issue.fields.status.id,
        name: issue.fields.status.name,
        category: issue.fields.status.statusCategory.name,
      },
      priority: issue.fields.priority ? {
        id: issue.fields.priority.id,
        name: issue.fields.priority.name,
      } : null,
      assignee: issue.fields.assignee ? {
        displayName: issue.fields.assignee.displayName,
        emailAddress: issue.fields.assignee.emailAddress,
      } : null,
      reporter: issue.fields.reporter ? {
        displayName: issue.fields.reporter.displayName,
        emailAddress: issue.fields.reporter.emailAddress,
      } : null,
      created: issue.fields.created,
      updated: issue.fields.updated,
      resolutionDate: issue.fields.resolutiondate,
      dueDate: issue.fields.duedate,
      labels: issue.fields.labels || [],
      components: issue.fields.components?.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
      })) || [],
      fixVersions: issue.fields.fixVersions?.map(v => ({
        id: v.id,
        name: v.name,
        releaseDate: v.releaseDate,
      })) || [],
      versions: issue.fields.versions?.map(v => ({
        id: v.id,
        name: v.name,
        releaseDate: v.releaseDate,
      })) || [],
    };

    // Add optional data based on config
    if (config.includeComments && issue.fields.comment?.comments) {
      processedIssue.comments = issue.fields.comment.comments.map(comment => ({
        id: comment.id,
        author: comment.author.displayName,
        body: comment.body,
        created: comment.created,
        updated: comment.updated,
      }));
    }

    if (config.includeAttachments && issue.fields.attachment) {
      processedIssue.attachments = issue.fields.attachment.map(attachment => ({
        id: attachment.id,
        filename: attachment.filename,
        size: attachment.size,
        mimeType: attachment.mimeType,
        author: attachment.author.displayName,
        created: attachment.created,
      }));
    }

    if (config.includeWorklog && issue.fields.worklog?.worklogs) {
      processedIssue.worklogs = issue.fields.worklog.worklogs.map(worklog => ({
        id: worklog.id,
        author: worklog.author.displayName,
        timeSpent: worklog.timeSpent,
        timeSpentSeconds: worklog.timeSpentSeconds,
        started: worklog.started,
        comment: worklog.comment,
      }));
    }

    if (config.includeSubtasks && issue.fields.subtasks) {
      processedIssue.subtasks = issue.fields.subtasks.map(subtask => ({
        id: subtask.id,
        key: subtask.key,
        summary: subtask.fields.summary,
        status: subtask.fields.status.name,
        issueType: subtask.fields.issuetype.name,
      }));
    }

    if (config.includeLinks && issue.fields.issuelinks) {
      processedIssue.issueLinks = issue.fields.issuelinks.map(link => ({
        id: link.id,
        type: {
          name: link.type.name,
          inward: link.type.inward,
          outward: link.type.outward,
        },
        linkedIssue: link.outwardIssue || link.inwardIssue ? {
          key: (link.outwardIssue || link.inwardIssue)!.key,
          summary: (link.outwardIssue || link.inwardIssue)!.fields.summary,
        } : null,
        direction: link.outwardIssue ? 'outward' : 'inward',
      }));
    }

    // Add parent if exists
    if (issue.fields.parent) {
      processedIssue.parent = {
        id: issue.fields.parent.id,
        key: issue.fields.parent.key,
        summary: issue.fields.parent.fields.summary,
      };
    }

    return processedIssue;
  }

  /**
   * Process issue for CSV export
   */
  private processIssueForCsv(issue: JiraIssue, config: ExportConfig): any {
    const csvRow: any = {
      'Issue ID': issue.id,
      'Issue Key': issue.key,
      'Summary': issue.fields.summary,
      'Description': issue.fields.description || '',
      'Issue Type': issue.fields.issuetype.name,
      'Project Key': issue.fields.project.key,
      'Project Name': issue.fields.project.name,
      'Status': issue.fields.status.name,
      'Priority': issue.fields.priority?.name || '',
      'Assignee': issue.fields.assignee?.displayName || '',
      'Reporter': issue.fields.reporter?.displayName || '',
      'Created': issue.fields.created,
      'Updated': issue.fields.updated,
      'Resolution Date': issue.fields.resolutiondate || '',
      'Due Date': issue.fields.duedate || '',
      'Labels': issue.fields.labels?.join(', ') || '',
      'Components': issue.fields.components?.map(c => c.name).join(', ') || '',
      'Fix Versions': issue.fields.fixVersions?.map(v => v.name).join(', ') || '',
      'Versions': issue.fields.versions?.map(v => v.name).join(', ') || '',
    };

    // Add parent information
    if (issue.fields.parent) {
      csvRow['Parent Key'] = issue.fields.parent.key;
      csvRow['Parent Summary'] = issue.fields.parent.fields.summary;
    }

    // Add subtasks count
    if (config.includeSubtasks && issue.fields.subtasks) {
      csvRow['Subtasks Count'] = issue.fields.subtasks.length;
      csvRow['Subtasks'] = issue.fields.subtasks.map(st => st.key).join(', ');
    }

    // Add comments count
    if (config.includeComments && issue.fields.comment) {
      csvRow['Comments Count'] = issue.fields.comment.total;
    }

    // Add attachments count
    if (config.includeAttachments && issue.fields.attachment) {
      csvRow['Attachments Count'] = issue.fields.attachment.length;
    }

    // Add worklog information
    if (config.includeWorklog && issue.fields.worklog) {
      csvRow['Worklog Count'] = issue.fields.worklog.total;
      const totalTimeSpent = issue.fields.worklog.worklogs?.reduce(
        (total, worklog) => total + worklog.timeSpentSeconds, 0
      ) || 0;
      csvRow['Total Time Spent (seconds)'] = totalTimeSpent;
      csvRow['Total Time Spent (hours)'] = Math.round(totalTimeSpent / 3600 * 100) / 100;
    }

    return csvRow;
  }
}