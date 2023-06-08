const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const multer = require('multer');
const { performance } = require('perf_hooks');

const app = express();
const port = 3000;

const upload = multer({ dest: 'uploads/' });

const findWordsPath = 'find_words.txt';
const frenchDictionaryPath = 'french_dictionary.csv';
const shakespeareTextPath = 't8.shakespeare.txt';

let findWords = [];
let frenchDictionary = {};
let shakespeareText = '';

async function readFileAsync(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

// async function processFiles() {
//   try {
//     findWords = (await readFileAsync(findWordsPath)).split('\n').filter(word => word.trim() !== '');


//     await new Promise((resolve, reject) => {
//       fs.createReadStream(frenchDictionaryPath)
//       .pipe(csv())
//       .on('data', (data) => {
//         const englishWord = Object.keys(data)[0];
//         const frenchWord = Object.values(data)[0];
//         frenchDictionary[englishWord] = frenchWord.trim();
//       })
//       .on('end', () => {
//         console.log('French dictionary loaded successfully');
//         resolve();
//       })
//       .on('error', (err) => {
//         reject(err);
//       });
//       // fs.createReadStream(frenchDictionaryPath)
//       //   .pipe(csv({ separator: ',' })) // Update separator to comma
//       //   .on('data', (data) => {
//       //     const englishWord = data['English Word'];
//       //     const frenchWord = data['French Word'];
    
//       //     if (frenchWord) { // Check if French word exists
//       //       frenchDictionary[englishWord] = frenchWord.trim();
//       //     }
//       //   })
//       //   .on('end', () => {
//       //     console.log('French dictionary loaded successfully');
//       //     resolve();
//       //   })
//       //   .on('error', (err) => {
//       //     reject(err);
//       //   });
//     });

//     // await new Promise((resolve, reject) => {
//     //   fs.createReadStream(frenchDictionaryPath)
//     //     .pipe(csv({ separator: '\t' }))
//     //     .on('data', (data) => {
//     //       const [englishWord, frenchWord] = Object.values(data);
//     //       frenchDictionary[englishWord] = frenchWord;
//     //     })
//     //     .on('end', () => {
//     //       console.log('French dictionary loaded successfully');
//     //       resolve();
//     //     })
//     //     .on('error', (err) => {
//     //       reject(err);
//     //     });
//     // });

//     shakespeareText = await readFileAsync(shakespeareTextPath);

//     console.log('All files loaded successfully');
//   } catch (err) {
//     console.error('Error reading files:', err);
//   }
// }

async function processFiles() {
  try {
    findWords = (await readFileAsync(findWordsPath)).split('\n').filter(word => word.trim() !== '');

    const fileData = fs.readFileSync(frenchDictionaryPath, 'utf8');
    const lines = fileData.split('\n');

    for (const line of lines) {
      const [englishWord, frenchWord] = line.trim().split(',');
      if (englishWord && frenchWord) {
        frenchDictionary[englishWord.toLowerCase()] = frenchWord.trim();
      }
    }

    console.log('French dictionary loaded successfully');
    
    shakespeareText = await readFileAsync(shakespeareTextPath);

    console.log('All files loaded successfully');
  } catch (err) {
    console.error('Error reading files:', err);
  }
}

function replaceWords(text, findWords, dictionary) {
  const wordsToReplace = new RegExp(`\\b(${findWords.join('|')})\\b`, 'gi');
  const replacedText = text.replace(wordsToReplace, (match) => {
    const englishWord = match.toLowerCase();
    const frenchWord = dictionary[englishWord];
    if (frenchWord) {
      return frenchWord;
    }
    return match;
  });
  return replacedText;
}


// function replaceWords(text, findWords, dictionary) {
//   const wordsToReplace = new RegExp(`\\b(${findWords.join('|')})\\b`, 'gi');
//   return text.replace(wordsToReplace, (match) => dictionary[match]);
// }

function processText() {
  const translatedText = replaceWords(shakespeareText, findWords, frenchDictionary);

  fs.writeFile('t8.shakespeare.translated.txt', translatedText, (err) => {
    if (err) {
      console.error('Error writing translated file:', err);
    } else {
      console.log('Translation file generated successfully');
    }
  });

  const frequencyData = {};
  findWords.forEach((word) => {
    const frequency = (translatedText.match(new RegExp(`\\b${frenchDictionary[word]}\\b`, 'gi')) || []).length;
    frequencyData[word] = { english: word, french: frenchDictionary[word], frequency };
  });

  const csvData = 'English Word,French Word,Frequency\n' +
    Object.values(frequencyData)
      .map(({ english, french, frequency }) => `${english},${french},${frequency}`)
      .join('\n');

  fs.writeFile('frequency.csv', csvData, (err) => {
    if (err) {
      console.error('Error writing frequency file:', err);
    } else {
      console.log('Frequency file generated successfully');
    }
  });

  return frequencyData;

  
}

function calculatePerformance(startTime, endTime) {
  // const elapsedTime = (endTime - startTime) / 1000; // Convert to seconds
  // const performanceData = `Total processing time: ${elapsedTime.toFixed(2)} seconds\n`;
  // fs.writeFile('performance.txt', performanceData, (err) => {
  //   if (err) {
  //     console.error('Error writing performance file:', err);
  //   } else {
  //     console.log('Performance file generated successfully');
  //   }
  // });

  // const startTime = performance.now();

  // ... your existing code ...

  // Calculate script execution time
  // const endTime = performance.now();
  const executionTime = (endTime - startTime) / 1000; // Convert to seconds

  // Get memory usage
  const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // Convert to MB

  // Generate performance.txt content
  const performanceData = `Time to process: ${executionTime.toFixed(2)} seconds\nMemory used: ${memoryUsage.toFixed(2)} MB`;

  fs.writeFile('performance.txt', performanceData, (err) => {
    if (err) {
      console.error('Error writing performance file:', err);
    } else {
      console.log('Performance file generated successfully');
    }
  });
}

// app.post('/upload', upload.single('file'), (req, res) => {
//   processFiles().then(() => {
//     const frequencyData = processText();
//     res.json({ frequencyData });
//   });
// });

app.post('/upload', upload.single('file'), (req, res) => {
  // const startTime = new Date().getTime();
  const startTime = performance.now();

  processFiles().then(() => {
    const frequencyData = processText();

    // const endTime = new Date().getTime();
    const endTime = performance.now();
    calculatePerformance(startTime, endTime);

    res.json({ frequencyData });
  });
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});




// const express = require('express');
// const fs = require('fs');
// const csv = require('csv-parser');
// const multer = require('multer');

// const app = express();
// const port = 3000;

// // Set up file upload using multer
// const upload = multer({ dest: 'uploads/' });

// // Read input files
// const findWordsPath = 'find_words.txt';
// const frenchDictionaryPath = 'french_dictionary.csv';
// const shakespeareTextPath = 't8.shakespeare.txt';

// let findWords = [];
// let frenchDictionary = {};
// let shakespeareText = '';

// fs.readFile(findWordsPath, 'utf8', (err, data) => {
//   if (err) {
//     console.error('Error reading find_words.txt:', err);
//     return;
//   }
//   findWords = data.split('\n').filter(word => word.trim() !== '');
// });

// fs.createReadStream(frenchDictionaryPath)
//   .pipe(csv({ separator: '\t' }))
//   .on('data', (data) => {
//     const [englishWord, frenchWord] = Object.values(data);
//     frenchDictionary[englishWord] = frenchWord;
//   })
//   .on('end', () => {
//     console.log('French dictionary loaded successfully');
//     processText(); // Call processText function here
//   });

// // fs.createReadStream(frenchDictionaryPath)
// //   .pipe(csv({ separator: '\t' }))
// //   .on('data', (data) => {
// //     const [englishWord, frenchWord] = Object.values(data);
// //     frenchDictionary[englishWord] = frenchWord;
// //   })
// //   .on('end', () => {
// //     console.log('French dictionary loaded successfully');
// //   });

// fs.readFile(shakespeareTextPath, 'utf8', (err, data) => {
//   if (err) {
//     console.error('Error reading t8.shakespeare.txt:', err);
//     return;
//   }
//   shakespeareText = data;
// });

// // Word replacement logic
// function replaceWords(text, findWords, dictionary) {
//   const wordsToReplace = new RegExp(`\\b(${findWords.join('|')})\\b`, 'gi');
//   return text.replace(wordsToReplace, (match) => dictionary[match]);
// }

// // Generate processed output and track word replacements
// function processText() {
//   const translatedText = replaceWords(shakespeareText, findWords, frenchDictionary);
//   fs.writeFile('t8.shakespeare.translated.txt', translatedText, (err) => {
//     if (err) {
//       console.error('Error writing translated file:', err);
//     } else {
//       console.log('Translation file generated successfully');
//     }
//   });

//   const frequencyData = {};
//   findWords.forEach((word) => {
//     const frequency = (translatedText.match(new RegExp(`\\b${frenchDictionary[word]}\\b`, 'gi')) || []).length;
//     frequencyData[word] = { english: word, french: frenchDictionary[word], frequency };
//   });

//   // Write frequency data to frequency.csv
//   const csvData = 'English Word,French Word,Frequency\n' +
//     Object.values(frequencyData)
//       .map(({ english, french, frequency }) => `${english},${french},${frequency}`)
//       .join('\n');
//   fs.writeFile('frequency.csv', csvData, (err) => {
//     if (err) {
//       console.error('Error writing frequency file:', err);
//     } else {
//       console.log('Frequency file generated successfully');
//     }
//   });

//   return frequencyData;
// }

// // Set up routes
// app.post('/upload', upload.single('file'), (req, res) => {
//   if (!req.file) {
//     res.status(400).send('No file uploaded');
//     return;
//   }

//   const filePath = req.file.path;
//   console.log('File uploaded:', filePath);

//   // Process the uploaded file
//   shakespeareText = fs.readFileSync(filePath, 'utf8');
//   const frequencyData = processText();

//   res.send('File uploaded successfully');
// });

// app.get('/process', (req, res) => {
//   const frequencyData = processText();

//   res.send('Data processed successfully');
// });

// app.listen(port, () => {
//   console.log(`Server listening on port ${port}`);
// });





// const express = require('express');
// const fs = require('fs');
// const csv = require('csv-parser');
// const multer = require('multer');
// const { MongoClient } = require('mongodb');

// const app = express();
// const port = 3000;

// // MongoDB connection URL
// const mongoURL = 'mongodb://127.0.0.1:27017';
// const dbName = 'wordReplacementsDB';
// const collectionName = 'wordReplacements';

// // Set up file upload using multer
// const upload = multer({ dest: 'uploads/' });

// // Read input files
// const findWordsPath = 'find_words.txt';
// const frenchDictionaryPath = 'french_dictionary.csv';
// const shakespeareTextPath = 't8.shakespeare.txt';

// let findWords = [];
// let frenchDictionary = {};
// let shakespeareText = '';

// fs.readFile(findWordsPath, 'utf8', (err, data) => {
//   if (err) {
//     console.error('Error reading find_words.txt:', err);
//     return;
//   }
//   findWords = data.split('\n').filter(word => word.trim() !== '');
// });

// fs.createReadStream(frenchDictionaryPath)
//   .pipe(csv({ separator: '\t' }))
//   .on('data', (data) => {
//     const [englishWord, frenchWord] = Object.values(data);
//     frenchDictionary[englishWord] = frenchWord;
//   })
//   .on('end', () => {
//     console.log('French dictionary loaded successfully');
//   });

// fs.readFile(shakespeareTextPath, 'utf8', (err, data) => {
//   if (err) {
//     console.error('Error reading t8.shakespeare.txt:', err);
//     return;
//   }
//   shakespeareText = data;
// });

// // Word replacement logic
// function replaceWords(text, findWords, dictionary) {
//   const wordsToReplace = new RegExp(`\\b(${findWords.join('|')})\\b`, 'gi');
//   return text.replace(wordsToReplace, (match) => dictionary[match]);
// }

// // Generate processed output and track word replacements
// function processText() {
//   const translatedText = replaceWords(shakespeareText, findWords, frenchDictionary);
//   fs.writeFile('t8.shakespeare.translated.txt', translatedText, (err) => {
//     if (err) {
//       console.error('Error writing translated file:', err);
//     } else {
//       console.log('Translation file generated successfully');
//     }
//   });

//   const frequencyData = {};
//   findWords.forEach((word) => {
//     const frequency = (translatedText.match(new RegExp(`\\b${frenchDictionary[word]}\\b`, 'gi')) || []).length;
//     frequencyData[word] = { english: word, french: frenchDictionary[word], frequency };
//   });

//   // Write frequency data to frequency.csv
//   const csvData = 'English Word,French Word,Frequency\n' +
//     Object.values(frequencyData)
//       .map(({ english, french, frequency }) => `${english},${french},${frequency}`)
//       .join('\n');
//   fs.writeFile('frequency.csv', csvData, (err) => {
//     if (err) {
//       console.error('Error writing frequency file:', err);
//     } else {
//       console.log('Frequency file generated successfully');
//     }
//   });

//   return frequencyData;
// }

// // Connect to MongoDB and perform CRUD operations
// MongoClient.connect(mongoURL, (err, client) => {
//   if (err) {
//     console.error('Error connecting to MongoDB:', err);
//     return;
//   }

//   console.log('Connected to MongoDB');

//   const db = client.db(dbName);
//   const collection = db.collection(collectionName);

//   // Store word replacements and frequency data in MongoDB
//   function saveData(data) {
//     collection.insertMany(Object.values(data), (err) => {
//       if (err) {
//         console.error('Error saving data to MongoDB:', err);
//       } else {
//         console.log('Data saved to MongoDB');
//       }
//     });
//   }

//   // Set up routes
//   app.post('/upload', upload.single('file'), (req, res) => {
//     if (!req.file) {
//       res.status(400).send('No file uploaded');
//       return;
//     }

//     const filePath = req.file.path;
//     console.log('File uploaded:', filePath);

//     // Process the uploaded file
//     shakespeareText = fs.readFileSync(filePath, 'utf8');
//     const frequencyData = processText();
//     saveData(frequencyData);

//     res.send('File uploaded successfully');
//   });

//   app.get('/process', (req, res) => {
//     const frequencyData = processText();
//     saveData(frequencyData);

//     res.send('Data processed successfully');
//   });

//   app.get('/files/:filename', (req, res) => {
//     const { filename } = req.params;
//     const file = `${__dirname}/${filename}`;
//     res.download(file, (err) => {
//       if (err) {
//         console.error('Error downloading file:', err);
//       }
//     });
//   });

//   // Start the server
//   app.listen(port, () => {
//     console.log(`Server running on port ${port}`);
//   });
// });





// const express = require('express');
// const fs = require('fs');
// const csv = require('csv-parser');
// const multer = require('multer');
// const MongoClient = require('mongodb').MongoClient;

// const app = express();
// const port = 3000;

// // MongoDB connection URL
// const mongoURL = 'mongodb://localhost:27017';
// const dbName = 'wordReplacementsDB';
// const collectionName = 'wordReplacements';

// // Read input files
// const findWordsPath = 'find_words.txt';
// const frenchDictionaryPath = 'french_dictionary.csv';
// const shakespeareTextPath = 't8.shakespeare.txt';

// let findWords = [];
// let frenchDictionary = {};
// let shakespeareText = '';

// fs.readFile(findWordsPath, 'utf8', (err, data) => {
//   if (err) {
//     console.error('Error reading find_words.txt:', err);
//     return;
//   }
//   findWords = data.split('\n').filter(word => word.trim() !== '');
// });

// fs.createReadStream(frenchDictionaryPath)
//   .pipe(csv({ separator: '\t' }))
//   .on('data', (data) => {
//     const [englishWord, frenchWord] = Object.values(data);
//     frenchDictionary[englishWord] = frenchWord;
//   })
//   .on('end', () => {
//     console.log('French dictionary loaded successfully');
//   });

// fs.readFile(shakespeareTextPath, 'utf8', (err, data) => {
//   if (err) {
//     console.error('Error reading t8.shakespeare.txt:', err);
//     return;
//   }
//   shakespeareText = data;
// });

// // Word replacement logic
// function replaceWords(text, findWords, dictionary) {
//   const wordsToReplace = new RegExp(`\\b(${findWords.join('|')})\\b`, 'gi');
//   return text.replace(wordsToReplace, (match) => dictionary[match]);
// }

// // Generate processed output and track word replacements
// function processText() {
//   const translatedText = replaceWords(shakespeareText, findWords, frenchDictionary);
//   fs.writeFile('t8.shakespeare.translated.txt', translatedText, (err) => {
//     if (err) {
//       console.error('Error writing translated file:', err);
//     } else {
//       console.log('Translation file generated successfully');
//     }
//   });

//   const frequencyData = {};
//   findWords.forEach((word) => {
//     const frequency = (translatedText.match(new RegExp(`\\b${frenchDictionary[word]}\\b`, 'gi')) || []).length;
//     frequencyData[word] = { english: word, french: frenchDictionary[word], frequency };
//   });

//   // Write frequency data to frequency.csv
//   const csvData = 'English Word,French Word,Frequency\n' +
//     Object.values(frequencyData)
//       .map(({ english, french, frequency }) => `${english},${french},${frequency}`)
//       .join('\n');
//   fs.writeFile('frequency.csv', csvData, (err) => {
//     if (err) {
//       console.error('Error writing frequency file:', err);
//     } else {
//       console.log('Frequency file generated successfully');
//     }
//   });

//   return frequencyData;
// }

// // Connect to MongoDB and perform CRUD operations
// MongoClient.connect(mongoURL, (err, client) => {
//   if (err) {
//     console.error('Error connecting to MongoDB:', err);
//     return;
//   }

//   console.log('Connected to MongoDB');

//   const db = client.db(dbName);
//   const collection = db.collection(collectionName);

//   // Store word replacements and frequency data in MongoDB
//   function saveData(data) {
//     collection.insertMany(Object.values(data), (err) => {
//       if (err) {
//         console.error('Error saving data to MongoDB:', err);
//       } else {
//         console.log('Data saved to MongoDB');
//       }
//       client.close();
//     });
//   }

//   // File upload route
//   app.post('/upload', multer({ dest: 'uploads/' }).single('file'), (req, res) => {
//     if (!req.file) {
//       res.status(400).send('No file uploaded');
//       return;
//     }

//     const filePath = req.file.path;
//     // Handle the uploaded file as needed
//     // ...

//     res.send('File uploaded successfully');
//   });

//   // Data processing route
//   app.get('/process', (req, res) => {
//     const startTime = process.hrtime();

//     // Perform data processing
//     processText();

//     const endTime = process.hrtime(startTime);
//     const executionTime = (endTime[0] + endTime[1] / 1e9).toFixed(2);
//     const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

//     // Update performance.txt
//     const performanceData = `Execution Time: ${executionTime} seconds\nMemory Usage: ${memoryUsage} MB\n`;
//     fs.writeFile('performance.txt', performanceData, (err) => {
//       if (err) {
//         console.error('Error writing performance file:', err);
//       } else {
//         console.log('Performance file updated successfully');
//       }
//     });

//     // Save data to MongoDB
//     saveData(processText());

//     res.send('Data processed successfully');
//   });

//   // Serve output files
//   app.get('/files/:filename', (req, res) => {
//     const { filename } = req.params;
//     const file = `${__dirname}/${filename}`;
//     res.download(file);
//   });

//   app.listen(port, () => {
//     console.log(`Server is listening on port ${port}`);
//   });
// });





// const express = require('express');
// const fs = require('fs');
// const csv = require('csv-parser');
// const MongoClient = require('mongodb').MongoClient;

// const app = express();
// const port = 3000;

// // MongoDB connection URL
// const mongoURL = 'mongodb://localhost:27017';
// const dbName = 'wordReplacementsDB';
// const collectionName = 'wordReplacements';

// // Read input files
// const findWordsPath = 'find_words.txt';
// const frenchDictionaryPath = 'french_dictionary.csv';
// const shakespeareTextPath = 't8.shakespeare.txt';

// let findWords = [];
// let frenchDictionary = {};
// let shakespeareText = '';

// fs.readFile(findWordsPath, 'utf8', (err, data) => {
//   if (err) {
//     console.error('Error reading find_words.txt:', err);
//     return;
//   }
//   findWords = data.split('\n').filter(word => word.trim() !== '');
// });

// fs.createReadStream(frenchDictionaryPath)
//   .pipe(csv({ separator: '\t' }))
//   .on('data', (data) => {
//     const [englishWord, frenchWord] = Object.values(data);
//     frenchDictionary[englishWord] = frenchWord;
//   })
//   .on('end', () => {
//     console.log('French dictionary loaded successfully');
//   });

// fs.readFile(shakespeareTextPath, 'utf8', (err, data) => {
//   if (err) {
//     console.error('Error reading t8.shakespeare.txt:', err);
//     return;
//   }
//   shakespeareText = data;
// });

// // Word replacement logic
// function replaceWords(text, findWords, dictionary) {
//   const wordsToReplace = new RegExp(`\\b(${findWords.join('|')})\\b`, 'gi');
//   return text.replace(wordsToReplace, (match) => dictionary[match]);
// }

// // Generate processed output and track word replacements
// function processText() {
//   const translatedText = replaceWords(shakespeareText, findWords, frenchDictionary);
//   fs.writeFile('t8.shakespeare.translated.txt', translatedText, (err) => {
//     if (err) {
//       console.error('Error writing translated file:', err);
//     } else {
//       console.log('Translation file generated successfully');
//     }
//   });

//   const frequencyData = {};
//   findWords.forEach((word) => {
//     const frequency = (translatedText.match(new RegExp(`\\b${frenchDictionary[word]}\\b`, 'gi')) || []).length;
//     frequencyData[word] = { english: word, french: frenchDictionary[word], frequency };
//   });

//   // Write frequency data to frequency.csv
//   const csvData = 'English Word,French Word,Frequency\n' +
//     Object.values(frequencyData)
//       .map(({ english, french, frequency }) => `${english},${french},${frequency}`)
//       .join('\n');
//   fs.writeFile('frequency.csv', csvData, (err) => {
//     if (err) {
//       console.error('Error writing frequency file:', err);
//     } else {
//       console.log('Frequency file generated successfully');
//     }
//   });

//   return frequencyData;
// }

// // Connect to MongoDB and perform CRUD operations
// MongoClient.connect(mongoURL, (err, client) => {
//   if (err) {
//     console.error('Error connecting to MongoDB:', err);
//     return;
//   }

//   console.log('Connected to MongoDB');

//   const db = client.db(dbName);
//   const collection = db.collection(collectionName);

//   // Store word replacements and frequency data in MongoDB
//   function saveData(data) {
//     collection.insertMany(Object.values(data), (err) => {
//       if (err) {
//         console.error('Error storing data in MongoDB:', err);
//       } else {
//         console.log('Data stored in MongoDB successfully');
//       }
//       client.close();
//     });
//   }

//   // Process the text, generate frequency data, and save to MongoDB
//   const frequencyData = processText();
//   saveData(frequencyData);
// });

// // Start the server
// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });





// const express = require('express');
// const fs = require('fs');
// const csv = require('csv-parser');
// const multer = require('multer');
// const axios = require('axios');
// const FormData = require('form-data');

// const MongoClient = require('mongodb').MongoClient;

// const app = express();
// const port = 3000;

// // MongoDB connection URL
// const mongoURL = 'mongodb://localhost:27017';
// const dbName = 'wordReplacementsDB';
// const collectionName = 'wordReplacements';

// // Read input files
// const findWordsPath = 'find_words.txt';
// const frenchDictionaryPath = 'french_dictionary.csv';
// const shakespeareTextPath = 't8.shakespeare.txt';

// let findWords = [];
// let frenchDictionary = {};
// let shakespeareText = '';

// fs.readFile(findWordsPath, 'utf8', (err, data) => {
//   if (err) {
//     console.error('Error reading find_words.txt:', err);
//     return;
//   }
//   findWords = data.split('\n').filter(word => word.trim() !== '');
// });

// fs.createReadStream(frenchDictionaryPath)
//   .pipe(csv({ separator: '\t' }))
//   .on('data', (data) => {
//     const [englishWord, frenchWord] = Object.values(data);
//     frenchDictionary[englishWord] = frenchWord;
//   })
//   .on('end', () => {
//     console.log('French dictionary loaded successfully');
//   });

// fs.readFile(shakespeareTextPath, 'utf8', (err, data) => {
//   if (err) {
//     console.error('Error reading t8.shakespeare.txt:', err);
//     return;
//   }
//   shakespeareText = data;
// });

// // Word replacement logic
// function replaceWords(text, findWords, dictionary) {
//   const wordsToReplace = new RegExp(`\\b(${findWords.join('|')})\\b`, 'gi');
//   return text.replace(wordsToReplace, (match) => dictionary[match]);
// }

// // Generate processed output and track word replacements
// function processText() {
//   const translatedText = replaceWords(shakespeareText, findWords, frenchDictionary);
//   fs.writeFile('t8.shakespeare.translated.txt', translatedText, (err) => {
//     if (err) {
//       console.error('Error writing translated file:', err);
//     } else {
//       console.log('Translation file generated successfully');
//     }
//   });

//   const frequencyData = {};
//   findWords.forEach((word) => {
//     const frequency = (translatedText.match(new RegExp(`\\b${frenchDictionary[word]}\\b`, 'gi')) || []).length;
//     frequencyData[word] = { english: word, french: frenchDictionary[word], frequency };
//   });

//   // Write frequency data to frequency.csv
//   const csvData = 'English Word,French Word,Frequency\n' +
//     Object.values(frequencyData)
//       .map(({ english, french, frequency }) => `${english},${french},${frequency}`)
//       .join('\n');
//   fs.writeFile('frequency.csv', csvData, (err) => {
//     if (err) {
//       console.error('Error writing frequency file:', err);
//     } else {
//       console.log('Frequency file generated successfully');
//     }
//   });

//   return frequencyData;
// }

// // Connect to MongoDB and perform CRUD operations
// MongoClient.connect(mongoURL, (err, client) => {
//   if (err) {
//     console.error('Error connecting to MongoDB:', err);
//     return;
//   }

//   console.log('Connected to MongoDB');

//   const db = client.db(dbName);
//   const collection = db.collection(collectionName);

//   // Store word replacements and frequency data in MongoDB
//   function saveData(data) {
//     collection.insertMany(Object.values(data), (err) => {
//       if (err) {
//         console.error('Error saving data to MongoDB:', err);
//       } else {
//         console.log('Data saved to MongoDB');
//       }
//       client.close();
//     });
//   }

//   // File upload route
// //   app.post('/upload', multer({ dest: 'uploads/' }).single('file'), (req, res) => {
// //     if (!req.file) {
// //       res.status(400).send('No file uploaded');
// //       return;
// //     }

// //     const filePath = req.file.path;
// //     // Handle the uploaded file as needed
// //     // ...

// //     res.send('File uploaded successfully');
// //   });

// app.post('/upload', multer({ dest: 'uploads/' }).single('file'), (req, res) => {
//     if (!req.file) {
//       res.status(400).send('No file uploaded');
//       return;
//     }
  
//     const filePath = req.file.path;
//     // Handle the uploaded file as needed
//     // ...
  
//     // Trigger data processing
//     axios.get('http://localhost:3000/process')
//       .then(response => {
//         console.log('Data processing triggered successfully');
//       })
//       .catch(error => {
//         console.error('Error triggering data processing:', error.message);
//       });
  
//     res.send('File uploaded successfully');
//   });
  

//   // Data processing route
//   app.get('/process', (req, res) => {
//     const startTime = process.hrtime();

//     // Perform data processing
//     processText();

//     const endTime = process.hrtime(startTime);
//     const executionTime = (endTime[0] + endTime[1] / 1e9).toFixed(2);
//     const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

//     // Update performance.txt
//     const performanceData = `Execution Time: ${executionTime} seconds\nMemory Usage: ${memoryUsage} MB\n`;
//     fs.writeFile('performance.txt', performanceData, (err) => {
//       if (err) {
//         console.error('Error writing performance file:', err);
//       } else {
//         console.log('Performance file updated successfully');
//       }
//     });

//     // Save data to MongoDB
//     saveData(processText());

//     res.send('Data processed successfully');
//   });

//   // Serve output files
//   app.get('/files/:filename', (req, res) => {
//     const { filename } = req.params;
//     const file = `${__dirname}/${filename}`;
//     res.download(file);
//   });

//   const fileData = fs.createReadStream('C:\Users\durga\OneDrive\Desktop\Exeter\t8.shakespeare.txt');
// const formData = new FormData();
// formData.append('file', fileData);

// axios.post('http://localhost:3000/upload', formData, {
//   headers: formData.getHeaders()
// })
//   .then(response => {
//     console.log('File uploaded successfully');
//   })
//   .catch(error => {
//     console.error('Error uploading file:', error.message);
//   });

//   app.listen(port, () => {
//     console.log(`Server is listening on port ${port}`);
//   });
// });
