import { Client, TextChannel } from 'discord.js';
import { uid } from 'uid';
import { addLog, triggerWorkflow, placeholderLoading } from '../helpers';
import state from '../state';

export default async function (client: Client) {
  client.on('guildMemberAdd', (member) => {
    try {
      if (member.user.bot || member.user.system) return;
      Object.keys(state.channels).forEach((key) => {
        const channel = state.channels[key];
        channel.forEach(async (trigger) => {
          if (trigger.type === 'userJoins') {
            addLog(`triggerWorkflow ${trigger.webhookId}`, client);
            const placeholderMatchingId = trigger.placeholder ? uid() : '';
            const sessionId = `shared-${trigger.webhookId}`;
            const isEnabled = await triggerWorkflow(trigger.webhookId, {
              message: null,
              placeholderId: placeholderMatchingId,
              baseUrl: state.baseUrl,
              user: member.user,
              channelId: key,
              sessionId,
            }).catch((e) => e);
            if (isEnabled && trigger.placeholder) {
              const channel = client.channels.cache.get(key);
              const placeholder = await (channel as TextChannel)
                .send(trigger.placeholder)
                .catch((e: any) => addLog(`${e}`, client));
              if (placeholder)
                placeholderLoading(placeholder, placeholderMatchingId, trigger.placeholder);
            }
          }
        });
      });
    } catch (e) {
      addLog(`${e}`, client);
    }
  });
}
