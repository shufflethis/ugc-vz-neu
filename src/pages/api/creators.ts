import type { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID!);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { branch, budget } = req.query;
    
    let filterFormula = '';
    if (branch && budget) {
      filterFormula = `AND({branch} = '${branch}', {budget} <= ${budget})`;
    } else if (branch) {
      filterFormula = `{branch} = '${branch}'`;
    } else if (budget) {
      filterFormula = `{budget} <= ${budget}`;
    }

    const records = await base(process.env.AIRTABLE_TABLE_NAME!)
      .select({
        filterByFormula: filterFormula || '',
      })
      .all();

    const creators = records.map((record) => ({
      id: record.id,
      ...record.fields,
    }));

    res.status(200).json(creators);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch creators' });
  }
}