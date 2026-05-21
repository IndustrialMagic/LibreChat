import { useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import {
  AuthTypeEnum,
  AuthorizationTypeEnum,
  TokenExchangeMethodEnum,
} from 'librechat-data-provider';
import {
  Label,
  OGDialog,
  TrashIcon,
  OGDialogTrigger,
  useToastContext,
  OGDialogTemplate,
} from '@librechat/client';
import type { ActionAuthForm } from '~/common';
import ActionsAuth from '~/components/SidePanel/Builder/ActionsAuth';
import { useAgentPanelContext } from '~/Providers/AgentPanelContext';
import { useDeleteAgentAction } from '~/data-provider';
import { Panel, isEphemeralAgent } from '~/common';
import ActionsInput from './ActionsInput';
import { useLocalize } from '~/hooks';

export default function ActionsPanel() {
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const { setActivePanel, action, setAction, agent_id } = useAgentPanelContext();
  const deleteAgentAction = useDeleteAgentAction({
    onSuccess: () => {
      showToast({
        message: localize('com_assistants_delete_actions_success'),
        status: 'success',
      });
      setActivePanel(Panel.builder);
      setAction(undefined);
    },
    onError(error) {
      showToast({
        message: (error as Error).message ?? localize('com_assistants_delete_actions_error'),
        status: 'error',
      });
    },
  });

  const methods = useForm<ActionAuthForm>({
    defaultValues: {
      /* General */
      type: AuthTypeEnum.None,
      saved_auth_fields: false,
      /* API key */
      api_key: '',
      authorization_type: AuthorizationTypeEnum.Basic,
      custom_auth_header: '',
      /* OAuth */
      oauth_client_id: '',
      oauth_client_secret: '',
      authorization_url: '',
      client_url: '',
      scope: '',
      token_exchange_method: TokenExchangeMethodEnum.DefaultPost,
    },
  });

  const { reset } = methods;

  useEffect(() => {
    if (action?.metadata.auth) {
      reset({
        type: action.metadata.auth.type || AuthTypeEnum.None,
        saved_auth_fields: false,
        api_key: action.metadata.api_key ?? '',
        authorization_type: action.metadata.auth.authorization_type || AuthorizationTypeEnum.Basic,
        oauth_client_id: action.metadata.oauth_client_id ?? '',
        oauth_client_secret: action.metadata.oauth_client_secret ?? '',
        authorization_url: action.metadata.auth.authorization_url ?? '',
        client_url: action.metadata.auth.client_url ?? '',
        scope: action.metadata.auth.scope ?? '',
        token_exchange_method:
          action.metadata.auth.token_exchange_method ?? TokenExchangeMethodEnum.DefaultPost,
      });
    }
  }, [action, reset]);

  return (
    <FormProvider {...methods}>
      <form className="h-full grow overflow-hidden">
        <div className="h-full overflow-auto px-2 text-sm">
          <div className="flex min-h-full flex-col pb-3">
            <div>
              <div className="flex flex-col">
                <header className="grid grid-cols-[auto_1fr_auto] items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActivePanel(Panel.builder);
                      setAction(undefined);
                    }}
                    aria-label={localize('com_ui_back_to_builder')}
                    className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-border-light text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring-primary"
                  >
                    <ChevronLeft className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                  </button>
                  <h2 className="text-center text-base font-semibold text-text-primary">
                    {(action ? 'Edit' : 'Add') + ' actions'}
                  </h2>
                  {action ? (
                    <OGDialog>
                      <OGDialogTrigger asChild>
                        <button
                          type="button"
                          disabled={isEphemeralAgent(agent_id) || !action.action_id}
                          aria-label={localize('com_ui_delete_action')}
                          className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-border-light text-red-500 transition-colors hover:bg-surface-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring-primary disabled:opacity-50"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </OGDialogTrigger>
                      <OGDialogTemplate
                        showCloseButton={false}
                        title={localize('com_ui_delete_action')}
                        className="max-w-[450px]"
                        main={
                          <Label className="text-left text-sm font-medium">
                            {localize('com_ui_delete_action_confirm')}
                          </Label>
                        }
                        selection={{
                          selectHandler: () => {
                            if (isEphemeralAgent(agent_id)) {
                              return showToast({
                                message: localize('com_agents_no_agent_id_error'),
                                status: 'error',
                              });
                            }
                            deleteAgentAction.mutate({
                              action_id: action.action_id,
                              agent_id: agent_id || '',
                            });
                          },
                          selectClasses:
                            'bg-red-700 dark:bg-red-600 hover:bg-red-800 dark:hover:bg-red-800 transition-color duration-200 text-white',
                          selectText: localize('com_ui_delete'),
                        }}
                      />
                    </OGDialog>
                  ) : (
                    <span aria-hidden="true" className="h-10 w-10" />
                  )}
                </header>
                <p className="mt-1 text-center text-xs text-text-secondary">
                  {localize('com_assistants_actions_info')}
                </p>
              </div>
              <ActionsAuth />
            </div>
            <div className="flex flex-1 flex-col">
              <ActionsInput action={action} agent_id={agent_id} setAction={setAction} />
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
