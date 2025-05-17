
type Log = {
  chat_id: number;
  message_id: number;
  date: number;
  username: string;
};

export class LogManager {
  constructor(private readonly env: Env) {}

  public async add(chat_id: number, message_id: number, date: number, username: string) {
    await this.env.DB.prepare('INSERT INTO logs (chat_id, message_id, date, username) VALUES(?,?,?,?)')
      .bind(chat_id, message_id, date, username)
      .run();

    await this.env.DB.prepare('DELETE FROM logs WHERE chat_id = ? AND message_id < ?')
      .bind(chat_id, message_id - 50)
      .run();
  }

  public async find(date: number, username: string): Promise<Log[]> {
    const { results } = await this.env.DB.prepare('SELECT * FROM logs where date = ? AND username = ?')
      .bind(date, username)
      .all<Log>();
    return results;
  }
}
