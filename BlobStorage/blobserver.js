require('dotenv').config();
const express = require('express');
const app = express();
const multer = require ("multer"); // storage of blobs
const port = 8080;
const {
    Aborter,
    BlockBlobURL,
    ContainerURL,
    ServiceURL,
    StorageURL,
    SharedKeyCredential,
    uploadStreamToBlockBlob
  } = require('@azure/storage-blob');

  const inMemoryStorage = multer.memoryStorage();
  const uploadStrategy = multer({ storage: inMemoryStorage }).single('blob');
  const getStream = require('into-stream');
  const containerName = 'blobcontainer';
  const ONE_MEGABYTE = 1024 * 1024;
  const uploadOptions = { bufferSize: 4 * ONE_MEGABYTE, maxBuffers: 20 };
  const ONE_MINUTE = 60 * 1000;
  const sharedKeyCredential = new SharedKeyCredential(
    process.env.AZURE_STORAGE_ACCOUNT_NAME,
    process.env.AZURE_STORAGE_ACCOUNT_ACCESS_KEY);
  const pipeline = StorageURL.newPipeline(sharedKeyCredential);
  const serviceURL = new ServiceURL(
    `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
    pipeline
  );

  const getBlobName = originalName => {
    // Use a random number to generate a unique file name, 
    // removing "0." from the start of the string.
    const identifier = Math.random().toString().replace(/0\./, ''); 
    return `${identifier}-${originalName}`;
  };
  
  app.use(express.static('.'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.post('/submit', uploadStrategy, async (req, res) => {
    const aborter = Aborter.timeout(30 * ONE_MINUTE);
    const blobName = getBlobName(req.file.originalname);
    const stream = getStream(req.file.buffer);
    const containerURL = ContainerURL.fromServiceURL(serviceURL, containerName);
    const blockBlobURL = BlockBlobURL.fromContainerURL(containerURL, blobName);
    
    
    try {
        await uploadStreamToBlockBlob(aborter, stream,
            blockBlobURL, uploadOptions.bufferSize, uploadOptions.maxBuffers);
            res.redirect("/")
            
        } catch (err) {
            res.json(err)

  }
});

app.get('/blobs', async(req, res) => {
    const containerURL = ContainerURL.fromServiceURL(serviceURL, containerName);

    try {

    const listBlobsResponse = await containerURL.listBlobFlatSegment(Aborter.none);

    for (const blob of listBlobsResponse.segment.blobItems) {
        console.log(`Blob: ${blob.name}`);
    }
        res.json(listBlobsResponse.segment.blobItems);

    } catch (err) {

        res.status(500);

    }
})
 
app.listen(8080, function () { 
   console.log("Listening to port 8080"); 
});