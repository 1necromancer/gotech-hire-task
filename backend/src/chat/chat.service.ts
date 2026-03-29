import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '../entities/room.entity';
import { Message } from '../entities/message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  async getRooms(): Promise<Room[]> {
    return this.roomRepository.find();
  }

  async createRoom(name: string, description?: string): Promise<Room> {
    const existing = await this.roomRepository.findOne({ where: { name } });
    if (existing) {
      return existing;
    }
    const room = this.roomRepository.create({ name, description });
    return this.roomRepository.save(room);
  }

  async getMessages(roomId: number, limit = 50, offset = 0): Promise<Message[]> {
    return this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.user', 'user')
      .where('message.roomId = :roomId', { roomId })
      .orderBy('message.createdAt', 'ASC')
      .skip(offset)
      .take(limit)
      .getMany();
  }

  async saveMessage(roomId: number, userId: number, content: string, senderName: string): Promise<Message> {
    const message = this.messageRepository.create({
      roomId,
      userId,
      content,
      senderName,
    });
    return this.messageRepository.save(message);
  }

  async deleteMessage(messageId: number, userId: number): Promise<boolean> {
    const msg = await this.messageRepository.findOne({ where: { id: messageId } });
    if (!msg || msg.userId !== userId) return false;
    await this.messageRepository.delete(messageId);
    return true;
  }
}
