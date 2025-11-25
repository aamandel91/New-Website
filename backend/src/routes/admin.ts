import Router from "@koa/router";
import { container } from "tsyringe";
import { Middleware } from "koa-jwt";
import { ApiError } from "../lib/errors.js";
import { RoleMiddlewareCreator } from "../providers/middleware/role.js";
import { UserRole } from "../constants.js";
import AdminService from "../services/admin.js";
import AdminSettingsService from "../services/adminSettings.js";
import { adminCreateAgentBatchSchema, adminUpdateAgentSchema, adminGetAgentsSchema } from "../validate/admin.js";
const router = new Router({
   prefix: "/admin"
});
const authMiddleware = container.resolve<Middleware>("middleware.jwt");
const roleMiddleware = container.resolve<RoleMiddlewareCreator>("middleware.role");
router.use(authMiddleware, roleMiddleware([UserRole.Admin, UserRole.Root]));
router.get('/agents', async ctx => {
   ctx.state['enable.xff'] = true;
   const {
      error,
      value
   } = adminGetAgentsSchema.validate({
      ...ctx.request.query
   });
   if (error) {
      ctx.throw(new ApiError(error.message, 400));
      return;
   }
   const adminService = ctx.state.container.resolve(AdminService);
   ctx.body = await adminService.getAgents(value);
});
router.post('/agents', async ctx => {
   ctx.state['enable.xff'] = true;
   const {
      error,
      value
   } = adminCreateAgentBatchSchema.validate([...ctx.request.body]);
   if (error) {
      ctx.throw(new ApiError(error.message, 400));
      return;
   }
   const adminService = ctx.state.container.resolve(AdminService);
   ctx.body = await adminService.createAgentsBatch(value);
});
router.patch('/agents/:agentId', async ctx => {
   ctx.state['enable.xff'] = true;
   const {
      error,
      value
   } = adminUpdateAgentSchema.validate({
      ...ctx.request.body,
      agentId: ctx.params['agentId']
   });
   if (error) {
      ctx.throw(new ApiError(error.message, 400));
      return;
   }
   const adminService = ctx.state.container.resolve(AdminService);
   ctx.body = await adminService.updateAgent(value);
});

// Admin Settings endpoints
router.get('/settings', async ctx => {
   const adminSettingsService = ctx.state.container.resolve(AdminSettingsService);
   ctx.body = await adminSettingsService.getAllSettings();
});

router.get('/settings/:key', async ctx => {
   const adminSettingsService = ctx.state.container.resolve(AdminSettingsService);
   const setting = await adminSettingsService.getSetting(ctx.params.key);
   if (!setting) {
      ctx.throw(new ApiError('Setting not found', 404));
      return;
   }
   ctx.body = setting;
});

router.patch('/settings/:key', async ctx => {
   const adminSettingsService = ctx.state.container.resolve(AdminSettingsService);
   const { value } = ctx.request.body;
   if (value === undefined) {
      ctx.throw(new ApiError('Value is required', 400));
      return;
   }
   const userEmail = ctx.state.user?.email;
   ctx.body = await adminSettingsService.updateSetting(ctx.params.key, value, userEmail);
});

// Specific PPC settings endpoints
router.get('/settings/ppc/registration', async ctx => {
   const adminSettingsService = ctx.state.container.resolve(AdminSettingsService);
   ctx.body = await adminSettingsService.getPpcRegistrationSettings();
});

router.patch('/settings/ppc/registration', async ctx => {
   const adminSettingsService = ctx.state.container.resolve(AdminSettingsService);
   const { enabled, sources, viewThreshold } = ctx.request.body;
   if (enabled === undefined || !sources || viewThreshold === undefined) {
      ctx.throw(new ApiError('enabled, sources, and viewThreshold are required', 400));
      return;
   }
   const userEmail = ctx.state.user?.email;
   ctx.body = await adminSettingsService.updatePpcRegistrationSettings({ enabled, sources, viewThreshold }, userEmail);
});

router.get('/settings/organic/registration', async ctx => {
   const adminSettingsService = ctx.state.container.resolve(AdminSettingsService);
   ctx.body = await adminSettingsService.getOrganicRegistrationSettings();
});

router.patch('/settings/organic/registration', async ctx => {
   const adminSettingsService = ctx.state.container.resolve(AdminSettingsService);
   const { enabled, viewThreshold } = ctx.request.body;
   if (enabled === undefined || viewThreshold === undefined) {
      ctx.throw(new ApiError('enabled and viewThreshold are required', 400));
      return;
   }
   const userEmail = ctx.state.user?.email;
   ctx.body = await adminSettingsService.updateOrganicRegistrationSettings({ enabled, viewThreshold }, userEmail);
});

export default router;