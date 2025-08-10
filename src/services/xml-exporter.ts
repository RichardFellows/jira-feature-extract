import { XMLBuilder } from 'fast-xml-parser';
import { saveAs } from 'file-saver';
import { JiraIssue } from '@/types/jira-api';
import { ExportConfig, ProgressInfo } from '@/types/app';

export class XmlExporter {
  private xmlBuilder: XMLBuilder;

  constructor() {
    this.xmlBuilder = new XMLBuilder({
      ignoreAttributes: false,
      format: true,
      suppressEmptyNode: true,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
    });
  }

  /**
   * Export issues to XML format
   */
  async exportToXml(
    issues: JiraIssue[],
    config: ExportConfig,
    onProgress?: (progress: ProgressInfo) => void
  ): Promise<string> {
    const startTime = new Date();
    let processedCount = 0;

    if (onProgress) {
      onProgress({
        current: 0,
        total: issues.length,
        percentage: 0,
        stage: 'processing',
        message: 'Preparing XML export...',
        startTime,
      });
    }

    const xmlData = {
      '?xml': {
        '@_version': '1.0',
        '@_encoding': 'UTF-8',
      },
      rss: {
        '@_version': '2.0',
        '@_xmlns:jira': 'http://www.atlassian.com/jira',
        '@_xmlns:dc': 'http://purl.org/dc/elements/1.1/',
        channel: {
          title: 'JIRA Feature Extract',
          link: '#',
          description: `Exported ${issues.length} issues`,
          language: 'en-uk',
          'build-info': {
            version: '1.0.0',
            'build-number': '1',
            'build-date': new Date().toISOString(),
          },
          item: [] as any[],
        },
      },
    };

    // Process each issue
    for (const issue of issues) {
      const xmlIssue = this.convertIssueToXml(issue, config);
      xmlData.rss.channel.item.push(xmlIssue);

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
        message: 'Generating XML...',
        startTime,
      });
    }

    const xmlString = this.xmlBuilder.build(xmlData);
    
    if (onProgress) {
      onProgress({
        current: processedCount,
        total: issues.length,
        percentage: 100,
        stage: 'complete',
        message: 'Export complete',
        startTime,
      });
    }

    return xmlString;
  }

  /**
   * Convert a JIRA issue to XML structure
   */
  private convertIssueToXml(issue: JiraIssue, config: ExportConfig): any {
    const xmlIssue: any = {
      '@_id': issue.id,
      title: issue.fields.summary,
      link: issue.self,
      'project-key': issue.fields.project.key,
      description: issue.fields.description || '',
      environment: issue.fields.environment || '',
      key: issue.key,
      summary: issue.fields.summary,
      type: {
        '@_id': issue.fields.issuetype.id,
        '@_iconUrl': issue.fields.issuetype.iconUrl,
        '#text': issue.fields.issuetype.name,
      },
      priority: issue.fields.priority ? {
        '@_id': issue.fields.priority.id,
        '@_iconUrl': issue.fields.priority.iconUrl,
        '#text': issue.fields.priority.name,
      } : undefined,
      status: {
        '@_id': issue.fields.status.id,
        '@_description': issue.fields.status.description,
        '#text': issue.fields.status.name,
      },
      resolution: issue.fields.resolution ? {
        '@_id': issue.fields.resolution.id,
        '#text': issue.fields.resolution.name,
      } : undefined,
      assignee: issue.fields.assignee ? {
        '@_username': issue.fields.assignee.name || issue.fields.assignee.key,
        '#text': issue.fields.assignee.displayName,
      } : undefined,
      reporter: issue.fields.reporter ? {
        '@_username': issue.fields.reporter.name || issue.fields.reporter.key,
        '#text': issue.fields.reporter.displayName,
      } : undefined,
      created: issue.fields.created,
      updated: issue.fields.updated,
      resolved: issue.fields.resolutiondate,
      version: issue.fields.versions?.map(v => ({
        '@_id': v.id,
        '#text': v.name,
      })) || [],
      'fix-version': issue.fields.fixVersions?.map(v => ({
        '@_id': v.id,
        '#text': v.name,
      })) || [],
      component: issue.fields.components?.map(c => ({
        '@_id': c.id,
        '#text': c.name,
      })) || [],
      labels: {
        label: issue.fields.labels || [],
      },
      'due-date': issue.fields.duedate,
    };

    // Add comments if requested
    if (config.includeComments && issue.fields.comment?.comments) {
      xmlIssue.comments = {
        '@_total': issue.fields.comment.total,
        comment: issue.fields.comment.comments.map(comment => ({
          '@_id': comment.id,
          '@_author': comment.author.displayName,
          '@_created': comment.created,
          '@_updated': comment.updated,
          '#text': comment.body,
        })),
      };
    }

    // Add attachments if requested
    if (config.includeAttachments && issue.fields.attachment) {
      xmlIssue.attachments = {
        '@_total': issue.fields.attachment.length,
        attachment: issue.fields.attachment.map(attachment => ({
          '@_id': attachment.id,
          '@_name': attachment.filename,
          '@_size': attachment.size,
          '@_author': attachment.author.displayName,
          '@_created': attachment.created,
          '#text': attachment.content,
        })),
      };
    }

    // Add worklogs if requested
    if (config.includeWorklog && issue.fields.worklog?.worklogs) {
      xmlIssue.worklogs = {
        '@_total': issue.fields.worklog.total,
        worklog: issue.fields.worklog.worklogs.map(worklog => ({
          '@_id': worklog.id,
          '@_author': worklog.author.displayName,
          '@_created': worklog.created,
          '@_started': worklog.started,
          '@_timeSpent': worklog.timeSpent,
          '@_timeSpentSeconds': worklog.timeSpentSeconds,
          '#text': worklog.comment || '',
        })),
      };
    }

    // Add subtasks if requested
    if (config.includeSubtasks && issue.fields.subtasks) {
      xmlIssue.subtasks = {
        '@_total': issue.fields.subtasks.length,
        subtask: issue.fields.subtasks.map(subtask => ({
          '@_id': subtask.id,
          '@_key': subtask.key,
          '@_type': subtask.fields.issuetype.name,
          '@_status': subtask.fields.status.name,
          '#text': subtask.fields.summary,
        })),
      };
    }

    // Add parent if it exists
    if (issue.fields.parent) {
      xmlIssue.parent = {
        '@_id': issue.fields.parent.id,
        '@_key': issue.fields.parent.key,
        '#text': issue.fields.parent.fields.summary,
      };
    }

    // Add issue links if requested
    if (config.includeLinks && issue.fields.issuelinks) {
      xmlIssue.issuelinks = {
        '@_total': issue.fields.issuelinks.length,
        issuelink: issue.fields.issuelinks.map(link => ({
          '@_id': link.id,
          '@_type': link.type.name,
          '@_direction': link.outwardIssue ? 'outward' : 'inward',
          '@_linktype': link.outwardIssue ? link.type.outward : link.type.inward,
          issuekey: (link.outwardIssue || link.inwardIssue)?.key,
          summary: (link.outwardIssue || link.inwardIssue)?.fields.summary,
        })),
      };
    }

    // Add custom fields if they're in the include list
    if (config.includeFields && config.includeFields.length > 0) {
      const customFields: any = {};
      for (const fieldKey of config.includeFields) {
        if (fieldKey.startsWith('customfield_') && issue.fields[fieldKey] !== undefined) {
          const fieldValue = issue.fields[fieldKey];
          if (fieldValue !== null) {
            customFields[fieldKey] = this.normalizeCustomField(fieldValue);
          }
        }
      }
      if (Object.keys(customFields).length > 0) {
        xmlIssue.customfields = customFields;
      }
    }

    return xmlIssue;
  }

  /**
   * Normalize custom field values for XML export
   */
  private normalizeCustomField(value: any): any {
    if (Array.isArray(value)) {
      return value.map(item => {
        if (typeof item === 'object' && item !== null) {
          return item.value || item.name || item.displayName || JSON.stringify(item);
        }
        return item;
      });
    }

    if (typeof value === 'object' && value !== null) {
      if (value.value !== undefined) return value.value;
      if (value.name !== undefined) return value.name;
      if (value.displayName !== undefined) return value.displayName;
      return JSON.stringify(value);
    }

    return value;
  }

  /**
   * Download XML as file
   */
  downloadXml(xmlContent: string, filename: string = 'jira-export.xml'): void {
    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8' });
    saveAs(blob, filename);
  }
}