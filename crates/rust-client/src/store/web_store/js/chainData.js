import { blockHeaders, chainMmrNodes } from "./schema.js";

// INSERT FUNCTIONS
export async function insertBlockHeader(
  blockNum,
  header,
  chainMmrPeaks,
  hasClientNotes
) {
  try {
    const headerBlob = new Blob([new Uint8Array(header)]);
    const chainMmrPeaksBlob = new Blob([new Uint8Array(chainMmrPeaks)]);

    const data = {
      blockNum: blockNum,
      header: headerBlob,
      chainMmrPeaks: chainMmrPeaksBlob,
      hasClientNotes: hasClientNotes.toString(),
    };

    const existingBlockHeader = await blockHeaders.get(blockNum);

    if (!existingBlockHeader) {
      await blockHeaders.add(data);
    } else {
      console.log("Block header already exists, checking for update.");

      // Update the hasClientNotes if the existing value is false
      if (existingBlockHeader.hasClientNotes === "false" && hasClientNotes) {
        await blockHeaders.update(blockNum, {
          hasClientNotes: hasClientNotes.toString(),
        });
        console.log("Updated hasClientNotes to true.");
      } else {
        console.log("No update needed for hasClientNotes.");
      }
    }
  } catch (err) {
    console.error("Failed to insert block header: ", err.toString());
    throw err;
  }
}

export async function insertChainMmrNodes(ids, nodes) {
  try {
    // Check if the arrays are not of the same length
    if (ids.length !== nodes.length) {
      throw new Error("ids and nodes arrays must be of the same length");
    }

    if (ids.length === 0) {
      return;
    }

    // Create array of objects with id and node
    const data = nodes.map((node, index) => ({
      id: ids[index],
      node: node,
    }));

    // Use bulkPut to add/overwrite the entries
    await chainMmrNodes.bulkPut(data);
  } catch (err) {
    console.error("Failed to insert chain mmr nodes: ", err.toString());
    throw err;
  }
}

// GET FUNCTIONS
export async function getBlockHeaders(blockNumbers) {
  try {
    const results = await blockHeaders.bulkGet(blockNumbers);

    const processedResults = await Promise.all(
      results.map(async (result, index) => {
        if (result === undefined) {
          return null;
        } else {
          const headerArrayBuffer = await result.header.arrayBuffer();
          const headerArray = new Uint8Array(headerArrayBuffer);
          const headerBase64 = uint8ArrayToBase64(headerArray);

          const chainMmrPeaksArrayBuffer =
            await result.chainMmrPeaks.arrayBuffer();
          const chainMmrPeaksArray = new Uint8Array(chainMmrPeaksArrayBuffer);
          const chainMmrPeaksBase64 = uint8ArrayToBase64(chainMmrPeaksArray);

          return {
            blockNum: result.blockNum,
            header: headerBase64,
            chainMmr: chainMmrPeaksBase64,
            hasClientNotes: result.hasClientNotes === "true",
          };
        }
      })
    );

    return processedResults;
  } catch (err) {
    console.error("Failed to get block headers: ", err.toString());
    throw err;
  }
}

export async function getTrackedBlockHeaders() {
  try {
    // Fetch all records matching the given root
    const allMatchingRecords = await blockHeaders
      .where("hasClientNotes")
      .equals("true")
      .toArray();

    // Process all records with async operations
    const processedRecords = await Promise.all(
      allMatchingRecords.map(async (record) => {
        const headerArrayBuffer = await record.header.arrayBuffer();
        const headerArray = new Uint8Array(headerArrayBuffer);
        const headerBase64 = uint8ArrayToBase64(headerArray);

        const chainMmrPeaksArrayBuffer =
          await record.chainMmrPeaks.arrayBuffer();
        const chainMmrPeaksArray = new Uint8Array(chainMmrPeaksArrayBuffer);
        const chainMmrPeaksBase64 = uint8ArrayToBase64(chainMmrPeaksArray);

        return {
          blockNum: record.blockNum,
          header: headerBase64,
          chainMmr: chainMmrPeaksBase64,
          hasClientNotes: record.hasClientNotes === "true",
        };
      })
    );

    return processedRecords;
  } catch (err) {
    console.error("Failed to get tracked block headers: ", err.toString());
    throw err;
  }
}

export async function getChainMmrPeaksByBlockNum(blockNum) {
  try {
    const blockHeader = await blockHeaders.get(blockNum);

    const chainMmrPeaksArrayBuffer =
      await blockHeader.chainMmrPeaks.arrayBuffer();
    const chainMmrPeaksArray = new Uint8Array(chainMmrPeaksArrayBuffer);
    const chainMmrPeaksBase64 = uint8ArrayToBase64(chainMmrPeaksArray);

    return {
      peaks: chainMmrPeaksBase64,
    };
  } catch (err) {
    console.error("Failed to get chain mmr peaks: ", err.toString());
    throw err;
  }
}

export async function getChainMmrNodesAll() {
  try {
    const chainMmrNodesAll = await chainMmrNodes.toArray();
    return chainMmrNodesAll;
  } catch (err) {
    console.error("Failed to get chain mmr nodes: ", err.toString());
    throw err;
  }
}

export async function getChainMmrNodes(ids) {
  try {
    const results = await chainMmrNodes.bulkGet(ids);

    return results;
  } catch (err) {
    console.error("Failed to get chain mmr nodes: ", err.toString());
    throw err;
  }
}

function uint8ArrayToBase64(bytes) {
  const binary = bytes.reduce(
    (acc, byte) => acc + String.fromCharCode(byte),
    ""
  );
  return btoa(binary);
}
