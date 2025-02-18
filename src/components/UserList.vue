<template>
  <div class="user-list">
    <h2>Selecione um usuário para enviar mensagem</h2>
    <ul>
      <li 
        v-for="user in users" 
        :key="user.id" 
        @click="selectUser(user)"
        class="user-item"
      >
        <div class="user-info">
          <strong>{{ user.name }}</strong> (ID: {{ user.id }})
        </div>
        <div v-if="user.last_message" class="last-message">
          <p>{{ user.last_message }}</p>
          <small>{{ formatDate(user.last_message_time) }}</small>
        </div>
        <div v-else class="last-message">
          <p>Nenhuma mensagem trocada ainda.</p>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
  import axios from 'axios';

  export default {
    data() {
      return {
        users: []
      };
    },
    async created() {
      await this.fetchUsers();
    },
    methods: {
      async fetchUsers() {
        const token = localStorage.getItem('token');
        try {
          const response = await axios.get('http://localhost:3000/users', {
            headers: { Authorization: token }
          });
          this.users = response.data;
        } catch (error) {
          console.error('Erro ao carregar usuários:', error);
        }
      },
      selectUser(user) {
        this.$router.push({ path: `/messages/${user.id}` });
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
  .user-list {
    max-width: 600px;
    margin: 2rem auto;
    padding: 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .user-item {
    padding: 0.8rem;
    margin: 0.5rem 0;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.1s;
  }

  .user-item:hover {
    background-color: #f0f0f0;
  }

  .user-info {
    margin-bottom: 0.5rem;
  }

  .last-message {
    font-size: 0.9rem;
    color: #555;
  }
</style>