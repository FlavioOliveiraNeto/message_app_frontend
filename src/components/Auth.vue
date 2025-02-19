<template>
    <div class="auth-container">
      <h2>Login</h2>
      <input 
        v-model.number="user_id" 
        type="number" 
        placeholder="Insira o ID do usuário"
        class="input-field"
      >
      <button @click="login" class="login-button">Entrar</button>
    </div>
</template>
  
<script>
  import axios from 'axios';
  
  export default {
    data() {
      return {
        user_id: null
      };
    },
    methods: {
      async login() {
        try {
          const response = await axios.post('http://localhost:3000/login', {
            user_id: this.user_id
          });
          
          localStorage.setItem('token', response.data.token);
          this.$router.push('/messages');
        } catch (error) {
          alert('ID inválido. Tente novamente.');
        }
      }
    }
  };
</script>
  
<style>
  .auth-container {
    max-width: 400px;
    margin: 2rem auto;
    padding: 2rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    text-align: center;
  }
  
  .input-field {
    width: 100%;
    padding: 0.8rem;
    margin: 1rem 0;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box;
  }
  
  .login-button {
    background-color: #4CAF50;
    color: white;
    padding: 0.8rem 1.5rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  
  .login-button:hover {
    background-color: #45a049;
  }
</style>