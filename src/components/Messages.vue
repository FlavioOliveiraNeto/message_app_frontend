<template>
  <div class="message-box" v-if="selectedUser">
    <h2>Conversa com {{ selectedUser.name }}</h2>

    <div class="message-container">

      <!-- Lista de mensagens -->
      <div v-for="message in messages"
          :key="message.id"
          class="message"
          :class="message.sender_id === currentUserId ? 'current-user-message' : 'other-user-message'">
        <strong>{{ message.sender_id === currentUserId ? 'Você' : selectedUser.name }}:</strong>

        <!-- Conteúdo de texto -->
        <p v-if="message.content">{{ message.content }}</p> 
        
        <!-- Conteúdo de anexo -->
        <div v-else-if="message.attachment_url" class="attachment-container">
          <!-- Imagens (clicáveis para abrir no modal) -->
          <img 
            v-if="message.attachment_content_type?.startsWith('image/')"
            :src="message.attachment_url" 
            class="attachment-preview"
            alt="Anexo de imagem"
            @click="openModal(message.attachment_url, 'image')"
          />
          
          <!-- Vídeos (clicáveis para abrir no modal) -->
          <video 
            v-else-if="message.attachment_content_type?.startsWith('video/')"
            controls
            class="attachment-preview"
            @click="openModal(message.attachment_url, 'video')"
          >
            <source :src="message.attachment_url" :type="message.attachment_content_type">
          </video>
          
          <!-- Outros arquivos -->
          <a 
            v-else
            :href="message.attachment_url" 
            target="_blank"
            class="file-download"
          >
            📎 Download {{ getFileName(message.attachment_url) }}
          </a>
        </div>
        <small>{{ formatDate(message.created_at) }}</small>
      </div>

      <!-- Controles de paginação -->
      <div class="pagination-controls">
        <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1">Anterior</button>
        <span>Página {{ currentPage }} de {{ totalPages }}</span>
        <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages">Próximo</button>
      </div>

      <!-- Modal para exibir imagens e vídeos -->
      <div v-if="showModal" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
          <button class="close-button" @click="closeModal">✖</button>
          <img v-if="modalType === 'image'" :src="modalContent" class="modal-image" />
          <video v-else-if="modalType === 'video'" controls class="modal-video">
            <source :src="modalContent" />
          </video>
        </div>
      </div>

      <!-- Campo de mensagem e envio -->
      <input v-model="newMessage" placeholder="Digite sua mensagem" class="message-input" />
      <div class="message-buttons">
        <input type="file" @change="onFileChange" />
        <button @click="sendMessage" class="send-button">Enviar</button>
      </div>
    </div>
  </div>
  <div v-else>
    <p>Carregando usuário...</p>
  </div>
</template>

<script>
  import axios from 'axios';
  import ActionCable from 'actioncable';

  export default {
    props: {
      userId: {
        type: String,
        required: true,
      },
    },
    data() {
      return {
        messages: [],
        newMessage: '',
        currentUserId: null,
        selectedUser: null,
        file: null,
        cable: null,
        subscription: null,
        currentPage: 1, 
        totalPages: 1,
        showModal: false, 
        modalContent: '', 
        modalType: '',  
      };
    },
    async created() {
      await this.fetchUserDetails();
      await this.fetchMessages();
      this.currentUserId = this.getCurrentUserId();
      this.connectToWebSocket();
    },
    methods: {
      async fetchUserDetails() {
        const token = localStorage.getItem('token');
        try {
          const response = await axios.get(`http://localhost:3000/users/${this.userId}`, {
            headers: { Authorization: token },
          });
          this.selectedUser = response.data;
        } catch (error) {
          console.error('Erro ao carregar detalhes do usuário:', error);
        }
      },
      async fetchMessages() {
        const token = localStorage.getItem('token');
        try {
          const response = await axios.get(
            `http://localhost:3000/messages?user_id=${this.userId}&page=${this.currentPage}`,
            {
              headers: { Authorization: token },
            }
          );
          this.messages = response.data.messages;
          this.totalPages = response.data.total_pages;
        } catch (error) {
          console.error('Erro ao carregar mensagens:', error);
        }
      },
      async sendMessage() {
        const token = localStorage.getItem('token');
        const formData = new FormData();

        formData.append('message[content]', this.newMessage);
        formData.append('message[receiver_id]', this.userId);

        if (this.file) {
          formData.append('message[attachment]', this.file);
        }

        try {
          await axios.post('http://localhost:3000/messages', formData, {
            headers: {
              Authorization: token,
              'Content-Type': 'multipart/form-data',
            },
          });

          this.newMessage = '';
          this.file = null;
          await this.fetchMessages();
        } catch (error) {
          console.error('Erro ao enviar mensagem:', error);
        }
      },
      getCurrentUserId() {
        const token = localStorage.getItem('token');
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          return payload.user_id;
        }
        return null;
      },
      formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString();
      },
      onFileChange(event) {
        this.file = event.target.files[0];
      },
      openModal(content, type) {
        this.modalContent = content;
        this.modalType = type;
        this.showModal = true;
      },
      closeModal() {
        this.showModal = false;
        this.modalContent = '';
        this.modalType = '';
      },
      getFileName(attachmentUrl) {
        return attachmentUrl.split('/').pop() || 'arquivo';
      },
      connectToWebSocket() {
        this.cable = ActionCable.createConsumer('ws://localhost:3000/cable');

        this.subscription = this.cable.subscriptions.create(
          { channel: 'MessagesChannel', user_id: this.currentUserId },
          {
            received: (message) => {
              this.messages.push(message);
            },
          }
        );
      },
      async changePage(page) {
        if (page >= 1 && page <= this.totalPages) {
          this.currentPage = page;
          await this.fetchMessages();
        }
      },
    },
    beforeUnmount() {
      if (this.subscription) {
        this.subscription.unsubscribe();
      }
    },
  };
</script>

<style>
  .message-box {
    display: grid;
    justify-items: center;
  }

  .message-container {
    max-width: 850px;
    width: calc(100vw - 25rem);
    min-width: 300px;
    margin: 2rem auto;
    padding: 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
  }

  .current-user-message {
    display: block;
    background-color: cadetblue;
    justify-self: left;
    border-radius: 15px 15px 15px 0;
  }

  .other-user-message {
    display: block;
    background-color: goldenrod;
    justify-self: right;
    border-radius: 15px 15px 0 15px;
  }

  .message {
    display: grid;
    gap: 0.3rem;
    max-width: 22rem;
    min-width: 15rem;
    padding: 0.8rem;
    margin: 0.5rem 0;
    border: 1px solid #ccc;
    border-radius: 4px;
    word-wrap: break-word;
  }

  strong {
    font-weight: bold;
  }

  p {
    width: 100%;
    white-space: pre-wrap;
    word-break: break-word;
    margin: 0.3rem 0 0.5rem 0;
  }

  span {
    height: fit-content;
  }

  .attachment-container {
    background-color: aliceblue;
    margin: 0.5rem 0;
  }

  .attachment-preview {
    max-width: 100%;
    max-height: 300px;
    border-radius: 4px;
    margin-top: 0.5rem;
  }

  .file-download {
    color: #2196F3;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    transition: background-color 0.3s;
  }

  .file-download:hover {
    background-color: #f5f5f5;
  }

  small {
    width: fit-content;
    justify-self: right;
  }

  .message-input {
    width: 100%;
    padding: 0.8rem;
    margin: 1rem 0;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  .message-buttons {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .pagination-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin: 1rem 0;
  }

  .pagination-controls button {
    background-color: #4caf50;
    color: white;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
  }

  .pagination-controls button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal-content {
    position: relative;
    background: #fff;
    padding: 10px;
    border-radius: 10px;
    max-width: 90%;
    max-height: 90%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .modal-image, .modal-video {
    max-width: 100%;
    max-height: 100%;
    border-radius: 8px;
  }

  .close-button {
    position: absolute;
    top: -15px;
    right: -15px;
    background: red;
    color: white;
    border: none;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    font-size: 18px;
    cursor: pointer;
  }

  .send-button {
    background-color: #4caf50;
    color: white;
    padding: 0.8rem 1.5rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
  }

  .send-button:hover {
    background-color: #45a049;
  }
</style>