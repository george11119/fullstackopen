const mongoose = require("mongoose")
const supertest = require("supertest")
const bcrypt = require("bcrypt")

const helper = require("./test_helper")
const app = require("../app")
const api = supertest(app)

const Note = require("../models/note")
const User = require("../models/user")


beforeEach(async () => {
  await Note.deleteMany({})
  await Note.insertMany(helper.initialNotes)
}, 100000)

describe("when there is initially some notes saved", () => {
  test("notes are returned as json", async () => {
    await api
    .get("/api/notes")
    .expect(200)
    .expect("Content-Type", /application\/json/)
  }, 100000)

  test("all notes are returned", async () => {
    const response = await api.get("/api/notes")

    expect(response.body).toHaveLength(helper.initialNotes.length)
  })

  test("a specific note is within the returned notes", async () => {
    const response = await api.get("/api/notes")

    const contents = response.body.map(r => r.content)
    expect(contents).toContain(
      "Browser can only execute javascript"
    )
  })
})

describe("viewing a specific note", () => {
  test("a specific note can be viewed", async () => {
    const notesAtStart = await helper.notesInDb()
    const noteToView = notesAtStart[0]

    const resultNote = await api
      .get(`/api/notes/${noteToView.id}`)
      .expect(200)
      .expect("Content-Type", /application\/json/)

    expect(resultNote.body).toEqual(noteToView)
  })

  test("fails with statuscode 404 if note does not exist", async () => {
    const validNonExistingId = await helper.nonExistingId()

    await api
      .get(`/api/notes/${validNonExistingId}`)
      .expect(404)
  })

  test("fails with statuscode 400 if id is invalid", async () => {
    const invalidId = "asdf"

    await api
      .get(`/api/notes/${invalidId}`)
      .expect(400)
  })
})

describe("addition of a new note", () => {
  test("succeeds with valid data", async () => {
    const newNote = {
      content: "async/await simplifies making async calls",
      important: true,
    }

    await api
    .post("/api/notes")
    .send(newNote)
    .expect(201)
    .expect("Content-Type", /application\/json/)

    const notesAtEnd = await helper.notesInDb()
    expect(notesAtEnd).toHaveLength(helper.initialNotes.length + 1)

    const contents = notesAtEnd.map(n => n.content)
    expect(contents).toContain(
      "async/await simplifies making async calls"
    )
  })

  test("fails with invalid data", async () => {
    const newNote = {
      important: true
    }

    await api
    .post("/api/notes")
    .send(newNote)
    .expect(400)

    const notesAtEnd = await helper.notesInDb()
    expect(notesAtEnd).toHaveLength(helper.initialNotes.length)
  })
})

describe("deletion of a note", () => {
  test("a note can be deleted", async () => {
    const notesAtStart = await helper.notesInDb()
    const noteToDelete = notesAtStart[0]

    await api
    .delete(`/api/notes/${noteToDelete.id}`)
    .expect(204)

    const notesAtEnd = await helper.notesInDb()
    expect(notesAtEnd).toHaveLength(
      helper.initialNotes.length - 1
    )

    const contents = notesAtEnd.map(r => r.content)
    expect(contents).not.toContain(noteToDelete.content)
  })
})

describe("When there is initially one user in db", () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash("sekret", 10)
    const user = new User({ username: "root", passwordHash })

    await user.save()
  })

  test("creation succeeds with a fresh username", async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: "jeff1",
      name: "Jeff Smith",
      password: "jeffsmith22",
    }

    await api
      .post("/api/users")
      .send(newUser)
      .expect(201)
      .expect("Content-Type", /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    expect(usernames).toContain(newUser.username)
  })

  test("creation fails with proper statuscode and message when username is already taken", async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: "root",
      name: "Superuser",
      password: "123456"
    }

    const result = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/)

    expect(result.body.error).toContain("expected `username` to be unique")

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toEqual(usersAtStart)
  })
})

afterAll(async () => {
  await mongoose.connection.close()
})
