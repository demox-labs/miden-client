import {
    db,
    stateSync,
    inputNotes,
    outputNotes,
    transactions,
    blockHeaders,
    chainMmrNodes,
} from './schema.js';

export async function getNoteTags() {
    try {
        const record = await stateSync.get(1);  // Since id is the primary key and always 1
        if (record) {
            let data = {
                tags: JSON.stringify(record.tags)
            }
            return data;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error fetching record:', error);
        return null;
    }
}

export async function getSyncHeight() {
    try {
        const record = await stateSync.get(1);  // Since id is the primary key and always 1
        if (record) {
            let data = {
                block_num: record.blockNum
            };
            return data;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error fetching record:', error);
        return null;
    }
}

export async function addNoteTag(
    tags
) {
    try {
        await stateSync.update(1, { tags: tags });
    } catch {
        console.error("Failed to add note tag: ", err);
        throw err;
    }
}

export async function applyStateSync(
    blockNum,
    nullifiers,
    blockHeader,
    chainMmrPeaks,
    hasClientNotes,
    nodeIndices,
    nodes,
    outputNoteIds,
    outputNoteInclusionProofs,
    inputNoteIds,
    inputNoteInluclusionProofs,
    inputeNoteMetadatas,
    transactionIds,
) {
    return db.transaction('rw', stateSync, inputNotes, outputNotes, transactions, blockHeaders, chainMmrNodes, async (tx) => {
        await updateSyncHeight(tx, blockNum);
        await updateSpentNotes(tx, nullifiers);
        await updateBlockHeader(tx, blockNum, blockHeader, chainMmrPeaks, hasClientNotes);
        await updateChainMmrNodes(tx, nodeIndices, nodes);
        await updateCommittedNotes(tx, outputNoteIds, outputNoteInclusionProofs, inputNoteIds, inputNoteInluclusionProofs, inputeNoteMetadatas);
        await updateCommittedTransactions(tx, blockNum, transactionIds);
    });
}

async function updateSyncHeight(
    tx, 
    blockNum
) {
    try {
        await tx.stateSync.update(1, { blockNum: blockNum });
    } catch (error) {
        console.error("Failed to update sync height: ", error);
        throw error;
    }
}

async function updateSpentNotes(
    tx,
    nullifiers
) {
    try {
        // Fetch all notes
        const inputNotes = await tx.inputNotes.toArray();
        const outputNotes = await tx.outputNotes.toArray();

        // Pre-parse all details and store them with their respective note ids for quick access
        const parsedInputNotes = inputNotes.map(note => ({
            noteId: note.noteId,
            details: JSON.parse(note.details)  // Parse the JSON string into an object
        }));

        // Iterate through each parsed note and check against the list of nullifiers
        for (const note of parsedInputNotes) {
            if (nullifiers.includes(note.details.nullifier)) {
                // If the nullifier is in the list, update the note's status
                await tx.inputNotes.update(note.noteId, { status: 'Consumed' });
            }
        }

         // Pre-parse all details and store them with their respective note ids for quick access
         const parsedOutputNotes = outputNotes.map(note => ({
            noteId: note.noteId,
            details: JSON.parse(note.details)  // Parse the JSON string into an object
        }));

        // Iterate through each parsed note and check against the list of nullifiers
        for (const note of parsedOutputNotes) {
            if (nullifiers.includes(note.details.nullifier)) {
                // If the nullifier is in the list, update the note's status
                await tx.outputNotes.update(note.noteId, { status: 'Consumed' });
            }
        }

    } catch (error) {
        console.error("Error updating input notes:", error);
        throw error;
    }
}

async function updateBlockHeader(
    tx,
    blockNum, 
    blockHeader,
    chainMmrPeaks,
    hasClientNotes
) {
    try {
        const data = {
            blockNum: blockNum,
            header: blockHeader,
            chainMmrPeaks: chainMmrPeaks,
            hasClientNotes: hasClientNotes
        };

        await tx.blockHeaders.add(data);
    } catch (err) {
        console.error("Failed to insert block header: ", err);
        throw error;
    }
}

async function updateChainMmrNodes(
    tx,
    nodeIndices,
    nodes
) {
    try {
        // Check if the arrays are not of the same length
        if (nodeIndices.length !== nodes.length) {
            throw new Error("nodeIndices and nodes arrays must be of the same length");
        }

        if (nodeIndices.length === 0) {
            return;
        }

        // Create the updates array with objects matching the structure expected by your IndexedDB schema
        const updates = nodeIndices.map((index, i) => ({
            id: index,  // Assuming 'index' is the primary key or part of it
            node: nodes[i] // Other attributes of the object
        }));

        // Perform bulk update or insertion; assumes tx.chainMmrNodes is a valid table reference in a transaction
        await tx.chainMmrNodes.bulkAdd(updates);
    } catch (err) {
        console.error("Failed to update chain mmr nodes: ", err);
        throw error;
    }
}

async function updateCommittedNotes(
    tx, 
    outputNoteIds, 
    outputNoteInclusionProofs,
    inputNoteIds,
    inputNoteInclusionProofs,
    inputNoteMetadatas
) {
    try {
        if (outputNoteIds.length === 0 || inputNoteIds.length === 0) {
            return;
        }

        if (outputNoteIds.length !== outputNoteInclusionProofs.length) {
            throw new Error("Arrays outputNoteIds and outputNoteInclusionProofs must be of the same length");
        }

        if (
            inputNoteIds.length !== inputNoteInclusionProofs.length && 
            inputNoteIds.length !== inputNoteMetadatas.length && 
            inputNoteInclusionProofs.length !== inputNoteMetadatas.length
        ) {
            throw new Error("Arrays inputNoteIds and inputNoteInclusionProofs and inputNoteMetadatas must be of the same length");
        }

        for (let i = 0; i < outputNoteIds.length; i++) {
            const noteId = outputNoteIds[i];
            const inclusionProof = outputNoteInclusionProofs[i];

            // Update output notes
            await tx.outputNotes.where({ noteId: noteId }).modify({
                status: 'Committed',
                inclusionProof: inclusionProof
            });
        }

        for (let i = 0; i < inputNoteIds.length; i++) {
            const noteId = inputNoteIds[i];
            const inclusionProof = inputNoteInclusionProofs[i];
            const metadata = inputNoteMetadatas[i];

            // Update input notes
            await tx.inputNotes.where({ noteId: noteId }).modify({
                status: 'Committed',
                inclusionProof: inclusionProof,
                metadata: metadata
            });
        }
    } catch (error) {
        console.error("Error updating committed notes:", error);
        throw error;
    }
}

async function updateCommittedTransactions(
    tx, 
    blockNum, 
    transactionIds
) {
    try {
        if (transactionIds.length === 0) {
            return;
        }

        // Fetch existing records
        const existingRecords = await tx.transactions.where('id').anyOf(transactionIds).toArray();

        // Create updates by merging existing records with the new values
        const updates = existingRecords.map(record => ({
            ...record, // Spread existing fields
            commitHeight: blockNum // Update specific field
        }));

        // Perform the update
        await tx.transactions.bulkPut(updates);
    } catch (err) {
        console.error("Failed to mark transactions as committed: ", err);
        throw err;
    }
}