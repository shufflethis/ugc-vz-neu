import { IncomingWebhook } from '@slack/webhook';
import type { NextApiRequest, NextApiResponse } from 'next';

const webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL!);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { creatorIds, clientInfo } = req.body;

    await webhook.send({
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🎯 Neue UGC Creator Anfrage",
            emoji: true
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Kunde:*\n${clientInfo.email}`
            },
            {
              type: "mrkdwn",
              text: `*Ausgewählte Creator:*\n${creatorIds.length} Creator`
            }
          ]
        }
      ]
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Slack notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
}