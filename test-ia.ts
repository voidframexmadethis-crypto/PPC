import dotenv from 'dotenv';
dotenv.config();

async function runTest() {
  const accessKey = process.env.IA_ACCESS_KEY;
  const secretKey = process.env.IA_SECRET_KEY;

  console.log("=== Internet Archive S3 API (IAS3) Isolated Test ===");
  console.log("Checking environment credentials...");
  
  if (!accessKey || !secretKey) {
    console.error("❌ FAILED: IA_ACCESS_KEY or IA_SECRET_KEY environment variables are missing.");
    console.log("Please define them in your environment or via the Settings menu in AI Studio.");
    return;
  }

  console.log(`IA_ACCESS_KEY is present: ${accessKey.substring(0, 4)}...`);
  console.log(`IA_SECRET_KEY is present: ${secretKey.substring(0, 4)}...`);

  // Generate a unique temporary item ID
  const testItemId = `krypside-test-item-${Math.random().toString(36).substring(2, 9)}`;
  const filename = `test_upload_handshake.txt`;
  const endpoint = `https://s3.us.archive.org/${testItemId}/${filename}`;
  const publicDownloadUrl = `https://archive.org/download/${testItemId}/${filename}`;

  console.log(`\nUsing Temporary Item ID (Bucket): ${testItemId}`);
  console.log(`Targeting Endpoint: ${endpoint}`);

  const testContent = `KRYPSIDE MASTER STORE - Isolated Storage Integration Handshake. Verified on: ${new Date().toISOString()}`;

  try {
    console.log("\nInitiating upload request (PUT)...");
    
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Authorization': `LOW ${accessKey}:${secretKey}`,
        'x-archive-auto-make-bucket': '1',
        'x-archive-meta-mediatype': 'texts',
        'x-archive-meta-title': 'Krypside Master Store Isolated Integration Test',
        'x-archive-meta-collection': 'opensource',
        'Content-Type': 'text/plain'
      },
      body: testContent
    });

    console.log(`Upload Response Status: ${response.status} ${response.statusText}`);
    
    if (response.status !== 200) {
      const responseBody = await response.text();
      console.error(`❌ Upload failed with status ${response.status}.`);
      console.error("Response Details:", responseBody);
      return;
    }

    console.log("✅ Upload request accepted successfully (HTTP 200)!");
    console.log("Verifying file propagation in public Internet Archive CDN...");

    // Wait a brief moment for item creation propagation
    console.log("Waiting 3 seconds for metadata propagation...");
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log(`Fetching from: ${publicDownloadUrl}`);
    const checkResponse = await fetch(publicDownloadUrl);
    
    console.log(`Verification Response Status: ${checkResponse.status} ${checkResponse.statusText}`);
    
    if (checkResponse.ok) {
      const returnedText = await checkResponse.text();
      if (returnedText.trim() === testContent.trim()) {
        console.log("\n🎉 SUCCESS! Isolated Internet Archive test passed perfectly!");
        console.log(`File is fully active and readable at: ${publicDownloadUrl}`);
        console.log(`Verification Content: "${returnedText}"`);
      } else {
        console.warn(`\n⚠️ WARNING: File exists, but content did not match!`);
        console.warn(`Sent: "${testContent}"`);
        console.warn(`Got:  "${returnedText}"`);
      }
    } else {
      console.error(`\n❌ Verification failed. Internet Archive returned status: ${checkResponse.status}`);
      console.log("Note: Item metadata or file may take some time to propagate fully across IA edge servers.");
    }

  } catch (error: any) {
    console.error("\n❌ An error occurred during the integration handshake test:");
    console.error(error);
  }
}

runTest();
