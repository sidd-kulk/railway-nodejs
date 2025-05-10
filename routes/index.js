const express = require('express');
const path = require('path');
const router = express.Router();

// Add a simple in-memory cache
const wordCache = new Map();
const CACHE_MAX_SIZE = 1000; // Maximum number of entries to prevent memory issues

// Cache cleanup function
function cleanupCache() {
  if (wordCache.size > CACHE_MAX_SIZE) {
    // Remove oldest 20% of entries when cache gets too large
    const keysToDelete = [...wordCache.keys()]
      .sort((a, b) => wordCache.get(a).timestamp - wordCache.get(b).timestamp)
      .slice(0, Math.floor(CACHE_MAX_SIZE * 0.2));

    keysToDelete.forEach(key => wordCache.delete(key));
    console.log(`Cache cleanup: removed ${keysToDelete.length} oldest entries`);
  }
}

// Periodically clean cache (every hour)
setInterval(cleanupCache, 60 * 60 * 1000);

// Serve the index.html file for the root route
router.get('/', (req, res) => {
  // Calculate expiration one year from now
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  
  // Set aggressive caching headers
  res.set({
    'Cache-Control': 'public, max-age=31536000', // Cache for 1 year (in seconds)
    'Expires': oneYearFromNow.toUTCString(),
    'ETag': '"homepage-v1"', // Simple version-based ETag
    'X-Content-Type-Options': 'nosniff'
  });
  
  res.sendFile(path.join(__dirname, '../views/index.html'));
});

router.get('/word-usage', async (req, res) => {
  const word = req.query.word;
  console.log('Word:', word);
  if (!word || word.trim().length === 0) {
    console.log('No word provided');
    res.sendFile(path.join(__dirname, '../views/404.html'));
    return; // Add return to prevent further execution
  }

   // Fix the contentstack check and add redirection
  // In your word-usage route handler
if(word.toLowerCase() === 'contentstack') {
  console.log('Showing loader before redirecting to Contentstack website');
  
  // Send an HTML page with loader and auto-redirect
  return res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Redirecting to Contentstack</title>
      <style>
        body {
          font-family: 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          background-color: #f8f9fa;
          color: #333;
        }
        
        .loader-container {
          text-align: center;
        }
        
        h1 {
          color: #2A4EDF;
          margin-bottom: 2rem;
        }
        
        .loader {
          border: 8px solid #f3f3f3;
          border-radius: 50%;
          border-top: 8px solid #2A4EDF;
          width: 60px;
          height: 60px;
          margin: 0 auto 2rem;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .message {
          margin-top: 1rem;
          font-size: 1.2rem;
        }
        
        .redirect-link {
          display: inline-block;
          margin-top: 2rem;
          padding: 0.8rem 1.5rem;
          background-color: #2A4EDF;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 600;
          transition: background-color 0.3s ease;
        }
        
        .redirect-link:hover {
          background-color: #1E3BC1;
        }
      </style>
    </head>
    <body>
      <div class="loader-container">
        <h1>Redirecting to Contentstack</h1>
        <div class="loader"></div>
        <p class="message">Please wait while we connect you to Contentstack...</p>
        <p>You will be redirected in a few seconds.</p>
        <a href="https://www.contentstack.com/" class="redirect-link">Click here if you are not redirected automatically</a>
      </div>
      
      <script>
        // Redirect after 2.5 seconds
        setTimeout(function() {
          window.location.href = "https://www.contentstack.com/";
        }, 2500);
      </script>
    </body>
    </html>
  `);
}

  try {
    let data;
    // Check if word is in cache
    if (wordCache.has(word)) {
      console.log(`Cache hit for word: ${word}`);
      const cacheEntry = wordCache.get(word);
      // Update timestamp to mark as recently used
      cacheEntry.timestamp = Date.now();
      data = cacheEntry.data;
    } else {
      console.log(`Cache miss for word: ${word}, fetching from API`);
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      data = await response.json();

      // Store in cache with timestamp
      wordCache.set(word, {
        data: data,
        timestamp: Date.now()
      });

      // Cleanup cache if needed
      if (wordCache.size > CACHE_MAX_SIZE) {
        cleanupCache();
      }
    }

    if (!data || data.length === 0 || !data[0] || !data[0].meanings || !data[0].meanings[0] || !data[0].meanings[0].definitions || !data[0].meanings[0].definitions[0]) {
      console.log('No data found');
      res.sendFile(path.join(__dirname, '../views/404.html'));
      return;
    }

    console.log('Data:', data[0].meanings[0].definitions[0].definition);

    // Create HTML response
    let html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Word Usage: ${word}</title>
        <style>
          :root {
            --primary-color: #4a6fa5;
            --secondary-color: #6e9887;
            --text-color: #333;
            --light-bg: #f8f9fa;
            --border-color: #e9ecef;
            --accent-color: #ffc107;
            --shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', sans-serif;
            line-height: 1.6;
            color: var(--text-color);
            background-color: #fff;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
          }
          
          header {
            text-align: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid var(--border-color);
          }
          
          h1 {
            color: var(--primary-color);
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
          }
          
          h2 {
            color: var(--secondary-color);
            margin: 1.5rem 0 1rem 0;
            font-size: 1.8rem;
          }
          
          .subtitle {
            color: #666;
            font-style: italic;
          }
          
          .definitions-container {
            margin-top: 1.5rem;
          }
          
          .part-of-speech {
            display: inline-block;
            background-color: var(--primary-color);
            color: white;
            padding: 0.3rem 0.8rem;
            border-radius: 20px;
            font-size: 0.9rem;
            margin: 1rem 0 0.5rem 0;
          }
          
          .definition {
            background-color: var(--light-bg);
            border-left: 4px solid var(--secondary-color);
            padding: 1rem;
            margin-bottom: 1rem;
            border-radius: 0 4px 4px 0;
            box-shadow: var(--shadow);
            transition: transform 0.2s ease;
          }
          
          .definition:hover {
            transform: translateX(5px);
          }
          
          .example {
            margin-top: 0.8rem;
            padding-left: 1rem;
            border-left: 2px solid var(--accent-color);
            font-style: italic;
            color: #555;
          }
          
          .back-link {
            display: inline-block;
            margin-top: 2rem;
            padding: 0.5rem 1rem;
            background-color: var(--primary-color);
            color: white;
            text-decoration: none;
            border-radius: 4px;
            transition: background-color 0.3s ease;
          }
          
          .back-link:hover {
            background-color: #3a5a80;
          }
        </style>
      </head>
      <body>
        <header>
          <h1>${word}</h1>
          <p class="subtitle">Analyzing usage and definitions</p>
        </header>
        
        <div class="definitions-container">
          <h2>Definitions:</h2>
      `;

    // Add this before the closing </div> tag and the back link
    html += `
  </div>
  
  <div class="search-container" style="margin-top: 3rem; padding: 1.5rem; background-color: var(--light-bg); border-radius: 8px; box-shadow: var(--shadow);">
    <h3 style="color: var(--secondary-color); margin-bottom: 1rem;">Look up another word</h3>
    <form action="/word-usage" method="get" style="display: flex; gap: 0.5rem;">
      <input 
        type="text" 
        name="word" 
        placeholder="Enter a word..." 
        style="flex: 1; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: 4px; font-size: 1rem;"
        required
      >
      <button 
        type="submit" 
        style="background-color: var(--primary-color); color: white; border: none; border-radius: 4px; padding: 0.6rem 1.2rem; cursor: pointer; transition: background-color 0.3s ease;"
        onmouseover="this.style.backgroundColor='#3a5a80'" 
        onmouseout="this.style.backgroundColor='var(--primary-color)'"
      >
        Search
      </button>
    </form>
  </div>
  
  <a href="/" class="back-link">Back to Home</a>
</body>
</html>
`;

    // Add all meanings and definitions
    data[0].meanings.forEach(meaning => {
      html += `<h3 class="part-of-speech">${meaning.partOfSpeech}</h3>`;

      meaning.definitions.forEach((def, index) => {
        html += `
          <div class="definition">
            <strong>${index + 1}.</strong> ${def.definition}
            ${def.example ? `<div class="example"><strong>Example:</strong> "${def.example}"</div>` : ''}
          </div>`;
      });
    });

    html += `
        </div>
        <a href="/" class="back-link">Back to Home</a>
      </body>
      </html>
      `;

    // Set aggressive caching headers
    // Calculate expiration one year from now
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    res.set({
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000', // Cache for 1 year (in seconds)
      'Expires': oneYearFromNow.toUTCString(),
      'ETag': `"${Buffer.from(word).toString('base64')}"`, // Simple ETag based on the word
    });

    // Send HTML response
    res.send(html);

  } catch (error) {
    console.error('Error fetching word data:', error);
    // Don't cache error responses
    res.set({
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, must-revalidate'
    });
    res.status(500).send(`
        <html>
          <head><title>Error</title></head>
          <body>
            <h1>Error</h1>
            <p>Failed to fetch word data: ${error.message}</p>
            <p><a href="/">Back to Home</a></p>
          </body>
        </html>
      `);
  }
});

module.exports = router;