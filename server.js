const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { Octokit } = require("@octokit/rest");

const app = express();
const port = 3000;

app.use(cors());

const GITHUB_REPO_OWNER = 'arafreally143amelia';
const GITHUB_REPO_NAME = 'teaches';
const GITHUB_FILE_PATH = 'teaches.json';
const GITHUB_TOKEN = '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';

const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});

const getTeaches = async () => {
  try {
    const response = await axios.get(`https://raw.githubusercontent.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/main/${GITHUB_FILE_PATH}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching teaches:', error);
    return [];
  }
};

const updateTeaches = async (newTeaches) => {
  try {
    const { data } = await octokit.repos.getContent({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      path: GITHUB_FILE_PATH,
    });

    const sha = data.sha;

    await octokit.repos.createOrUpdateFileContents({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      path: GITHUB_FILE_PATH,
      message: 'Update teaches',
      content: Buffer.from(JSON.stringify(newTeaches, null, 2)).toString('base64'),
      sha,
    });
  } catch (error) {
    console.error('Error updating teaches:', error);
  }
};

app.get('/chat', async (req, res) => {
  try {
    const text = req.query.text;

    if (!text) {
      return res.status(400).json({ error: 'Text query is required' });
    }

    const apiResponse = await axios.get(`https://dwy64y-3000.csb.app/dipto?text=${encodeURIComponent(text)}`);
    
    if (apiResponse.data && apiResponse.data.reply) {
      return res.json({ reply: apiResponse.data.reply });
    }

    const teaches = await getTeaches();
    const match = teaches.find(t => t.message.toLowerCase() === text.toLowerCase());

    if (match) {
      const randomReply = match.replies[Math.floor(Math.random() * match.replies.length)];
      return res.json({ reply: randomReply });
    }

    return res.json({ reply: 'No response found.' });
  } catch (error) {
    console.error('Error during chat:', error);
    res.status(500).json({ error: 'Error during chat' });
  }
});

app.get('/teach', async (req, res) => {
  try {
    const { text, reply } = req.query;

    if (!text || !reply) {
      return res.status(400).json({ error: 'Both text and reply are required' });
    }

    const currentTeaches = await getTeaches();

    const newTeach = {
      message: text,
      replies: [reply.trim()],
    };

    currentTeaches.push(newTeach);

    await updateTeaches(currentTeaches);

    res.json({ message: 'Teach added successfully!', teaches: currentTeaches });
  } catch (error) {
    console.error('Error during teach:', error);
    res.status(500).json({ error: 'Error during teach' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
