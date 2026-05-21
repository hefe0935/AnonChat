/**
 * Secure File Sharing Module
 * Uses WebRTC DataChannel for peer-to-peer file transfer
 */

class FileShareManager {
  constructor() {
    this.dataChannel = null;
    this.fileTransfers = new Map();
    this.onFileReceived = null;
    this.onProgress = null;
  }

  /**
   * Initialize DataChannel for file sharing
   */
  initDataChannel(peerConnection) {
    try {
      // Create data channel for file transfer
      this.dataChannel = peerConnection.createDataChannel('file-sharing', {
        ordered: true,
      });
      this.setupDataChannelListeners();
      console.log('DataChannel created for file sharing');
    } catch (err) {
      console.error('Error creating DataChannel:', err);
    }
  }

  /**
   * Handle incoming DataChannel
   */
  onDataChannel(event) {
    this.dataChannel = event.channel;
    this.setupDataChannelListeners();
    console.log('DataChannel received for file sharing');
  }

  /**
   * Setup DataChannel event listeners
   */
  setupDataChannelListeners() {
    if (!this.dataChannel) return;

    this.dataChannel.onopen = () => {
      console.log('DataChannel opened for file transfer');
    };

    this.dataChannel.onclose = () => {
      console.log('DataChannel closed');
    };

    this.dataChannel.onerror = (error) => {
      console.error('DataChannel error:', error);
    };

    this.dataChannel.onmessage = (event) => {
      this.handleIncomingMessage(event.data);
    };
  }

  /**
   * Handle incoming message (metadata or file chunk)
   */
  handleIncomingMessage(data) {
    try {
      if (typeof data === 'string') {
        // Metadata message
        const metadata = JSON.parse(data);
        if (metadata.type === 'file-start') {
          this.fileTransfers.set(metadata.fileId, {
            name: metadata.fileName,
            size: metadata.fileSize,
            type: metadata.fileType,
            data: [],
            received: 0,
          });
          console.log(`Starting file transfer: ${metadata.fileName}`);
        }
      } else if (data instanceof ArrayBuffer) {
        // File chunk received
        const view = new Uint8Array(data);
        const fileId = view[0] + view[1] * 256; // Simple file ID extraction
        
        const transfer = Array.from(this.fileTransfers.values())[0];
        if (transfer) {
          transfer.data.push(data);
          transfer.received += data.byteLength;

          // Notify progress
          if (this.onProgress) {
            this.onProgress({
              fileId,
              received: transfer.received,
              total: transfer.size,
              percent: (transfer.received / transfer.size) * 100,
            });
          }

          // Check if transfer complete
          if (transfer.received >= transfer.size) {
            this.completeFileTransfer(fileId);
          }
        }
      }
    } catch (err) {
      console.error('Error handling incoming message:', err);
    }
  }

  /**
   * Send file through DataChannel
   */
  async sendFile(file) {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      console.error('DataChannel not ready');
      return false;
    }

    const fileId = Math.random().toString(36).substr(2, 9);

    // Send metadata
    const metadata = {
      type: 'file-start',
      fileId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    };

    this.dataChannel.send(JSON.stringify(metadata));

    // Send file in chunks (64KB chunks)
    const chunkSize = 64 * 1024;
    let offset = 0;

    try {
      while (offset < file.size) {
        const chunk = file.slice(offset, offset + chunkSize);
        const buffer = await chunk.arrayBuffer();
        
        // Add file ID to chunk header
        const idBytes = new Uint8Array(2);
        idBytes[0] = fileId.charCodeAt(0) % 256;
        idBytes[1] = fileId.charCodeAt(1) % 256;
        
        const fullChunk = new Uint8Array(buffer.byteLength + 2);
        fullChunk.set(idBytes);
        fullChunk.set(new Uint8Array(buffer), 2);

        this.dataChannel.send(fullChunk.buffer);

        offset += chunkSize;

        // Notify progress
        if (this.onProgress) {
          this.onProgress({
            fileId,
            sent: offset,
            total: file.size,
            percent: (offset / file.size) * 100,
          });
        }

        // Throttle sending if buffer is getting full
        if (this.dataChannel.bufferedAmount > 16 * 1024 * 1024) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      console.log(`File sent: ${file.name}`);
      return true;
    } catch (err) {
      console.error('Error sending file:', err);
      return false;
    }
  }

  /**
   * Complete file transfer and trigger callback
   */
  completeFileTransfer(fileId) {
    const transfer = this.fileTransfers.get(fileId);
    if (!transfer) return;

    try {
      const blob = new Blob(transfer.data, { type: transfer.type });
      const url = URL.createObjectURL(blob);

      if (this.onFileReceived) {
        this.onFileReceived({
          fileName: transfer.name,
          fileSize: transfer.size,
          fileType: transfer.type,
          url,
          blob,
        });
      }

      this.fileTransfers.delete(fileId);
      console.log(`File received: ${transfer.name}`);
    } catch (err) {
      console.error('Error completing file transfer:', err);
    }
  }

  /**
   * Cancel file transfer
   */
  cancelTransfer(fileId) {
    this.fileTransfers.delete(fileId);
    console.log(`File transfer cancelled: ${fileId}`);
  }

  /**
   * Check if DataChannel is ready
   */
  isReady() {
    return this.dataChannel && this.dataChannel.readyState === 'open';
  }

  /**
   * Close DataChannel
   */
  close() {
    if (this.dataChannel) {
      this.dataChannel.close();
    }
  }
}

export default new FileShareManager();
