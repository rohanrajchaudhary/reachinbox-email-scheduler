import elasticsearch from "../config/elasticsearch";

const INDEX_NAME = "emails";

export async function ensureEmailIndex(): Promise<void> {
  const exists = await elasticsearch.indices.exists({
    index: INDEX_NAME,
  });

  if (exists) {
    return;
  }

  await elasticsearch.indices.create({
    index: INDEX_NAME,
    mappings: {
      properties: {
        recipientEmail: {
          type: "keyword",
        },
        subject: {
          type: "text",
        },
        body: {
          type: "text",
        },
        scheduledAt: {
          type: "date",
        },
        sentAt: {
          type: "date",
        },
        status: {
          type: "keyword",
        },
        userId: {
          type: "keyword",
        },
      },
    },
  });

  console.log(`Elasticsearch index "${INDEX_NAME}" created`);
}

interface EmailDocument {
  id: string;
  userId: string;
  recipientEmail: string;
  subject: string;
  body: string;
  scheduledAt: Date;
  sentAt?: Date | null;
  status: string;
}

export async function indexEmail(
  email: EmailDocument
): Promise<void> {
  await elasticsearch.index({
    index: INDEX_NAME,
    id: email.id,
    document: {
      userId: email.userId,
      recipientEmail: email.recipientEmail,
      subject: email.subject,
      body: email.body,
      scheduledAt: email.scheduledAt,
      sentAt: email.sentAt || null,
      status: email.status,
    },
  });
}

export async function updateEmailIndex(
  email: EmailDocument
): Promise<void> {
  await elasticsearch.index({
    index: INDEX_NAME,
    id: email.id,
    document: {
      userId: email.userId,
      recipientEmail: email.recipientEmail,
      subject: email.subject,
      body: email.body,
      scheduledAt: email.scheduledAt,
      sentAt: email.sentAt || null,
      status: email.status,
    },
  });
}

export async function searchEmails(
  userId: string,
  query: string
) {
  const result = await elasticsearch.search({
    index: INDEX_NAME,
    query: {
      bool: {
        must: [
          {
            multi_match: {
              query,
              fields: [
                "recipientEmail",
                "subject",
                "body",
                "status",
              ],
            },
          },
        ],
        filter: [
          {
            term: {
              userId,
            },
          },
        ],
      },
    },
  });

  return result.hits.hits;
}