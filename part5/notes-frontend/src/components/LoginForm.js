import { useState } from "react"

const LoginForm = ({ handleLogin }) => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const login = (event) => {
    event.preventDefault()

    handleLogin(username, password)
  }

  return (
    <form onSubmit={login}>
      <div>
        username:
        <input
          type="text"
          value={username}
          name="Username"
          onChange={({ target }) => setUsername(target.value)}
        />
      </div>
      <div>
        password:
        <input
          type="password"
          value={password}
          name="Password"
          onChange={({ target }) => setPassword(target.value)}
        />
        <div>
          <button type="submit">Login</button>
        </div>
      </div>
    </form>
  )
}

export default LoginForm
