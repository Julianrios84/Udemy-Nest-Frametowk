import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Socket } from 'socket.io';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';

interface ConnectedClients {
  [id: string]: {
    socket: Socket,
    user: User
  }
}

@Injectable()
export class MessagesWsService {

  private connectedClients: ConnectedClients = {}

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>
  ){}

  public  async registerClient(client: Socket, userId: string) {
    const user = await this.userRepository.findOneBy({ id: userId })
    if(!user) throw new Error('User not found!')
    if(!user.isActive) throw new Error('User not active!') 
    this.connectedClients[client.id] = {
      socket: client,
      user: user
    };
  }

  public removeClient(clinetId: string) {
    delete this.connectedClients[clinetId];
  }

  public getConnectedClients(): number {
    return Object.keys(this.connectedClients).length;
  }

  public getUserFullName(socketId: string) {
    return this.connectedClients[socketId].user.fullName;
  }

  private checkUserConnection(user: User) {
    for (const clientId of Object.keys(this.connectedClients)) {
      const connectedClient = this.connectedClients[clientId]
      if(connectedClient.user.id === user.id) {
        connectedClient.socket.disconnect();
        break;
      }
    }
  }

}
