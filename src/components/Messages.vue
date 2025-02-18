<template>
    <div class="message-box" v-if="selectedUser">
        <h2>Conversa com {{ selectedUser.name }}</h2>
    
        <div class="message-container">
            <div v-for="message in messages" :key="message.id" class="message" :class="message.sender_id === currentUserId ? 'current-user-message' : 'other-user-message'">
                <strong>{{ message.sender_id === currentUserId ? 'Você' : selectedUser.name }}:</strong>
                <p>{{ message.content }}</p>
                <small>{{ formatDate(message.created_at) }}</small>
            </div>
            <input v-model="newMessage" placeholder="Digite sua mensagem" class="message-input" />
            <button @click="sendMessage" class="send-button">Enviar</button>
        </div>
    </div>
</template>
  
<script>
  import axios from 'axios';
  
  export default {
    props: {
      userId: {
        type: String,
        required: true
      }
    },
    data() {
      return {
        messages: [],
        newMessage: '',
        currentUserId: null,
        selectedUser: null
      };
    },
    async created() {
      await this.fetchUserDetails();
      await this.fetchMessages();
      this.currentUserId = this.getCurrentUserId();
    },
    methods: {
      async fetchUserDetails() {
        const token = localStorage.getItem('token');
        try {
          const response = await axios.get(`http://localhost:3000/users/${this.userId}`, {
            headers: { Authorization: token }
          });
          this.selectedUser = response.data;
        } catch (error) {
          console.error('Erro ao carregar detalhes do usuário:', error);
        }
      },
      async fetchMessages() {
        const token = localStorage.getItem('token');
        try {
          const response = await axios.get(`http://localhost:3000/messages?user_id=${this.userId}`, {
            headers: { Authorization: token }
          });
          this.messages = response.data;
        } catch (error) {
          console.error('Erro ao carregar mensagens:', error);
        }
      },
      async sendMessage() {
        const token = localStorage.getItem('token');
        try {
          await axios.post(
            'http://localhost:3000/messages',
            {
              content: this.newMessage,
              receiver_id: this.userId
            },
            {
              headers: { Authorization: token }
            }
          );
          this.newMessage = '';
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
      }
    }
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
    }

    .other-user-message {
        display: block;
        background-color: goldenrod;
        justify-self: right;
    }
    
    .message {
        display: grid;
        gap: .3rem;
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
    
    .send-button {
        background-color: #4CAF50;
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