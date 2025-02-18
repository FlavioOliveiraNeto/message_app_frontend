<template>
  <div class="message-box" v-if="selectedUser">
    <h2>Conversa com {{ selectedUser.name }}</h2>

    <div class="message-container">
      <!-- Lista de mensagens -->
      <div
        v-for="message in messages"
        :key="message.id"
        class="message"
        :class="message.sender_id === currentUserId ? 'current-user-message' : 'other-user-message'"
      >
        <strong>{{ message.sender_id === currentUserId ? 'Você' : selectedUser.name }}:</strong>
        <p>{{ message.content }}</p>
        <small>{{ formatDate(message.created_at) }}</small>
      </div>

      <!-- Controles de paginação -->
      <div class="pagination-controls">
        <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1">Anterior</button>
        <span>Página {{ currentPage }} de {{ totalPages }}</span>
        <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages">Próximo</button>
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
    max-width: 20rem;
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