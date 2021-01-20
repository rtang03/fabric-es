/**
 * @about notification for web ui, upon read status
 */
export type Notification = {
  id: string;
  commitId: string;
  entityName: string;
  read: boolean;
  creator: string;
};
