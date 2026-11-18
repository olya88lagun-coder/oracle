import { THREAD_REPORT_PRODUCT } from "@oracle/core";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, test, vi } from "vitest";
import Page from "./page";

const mocks = vi.hoisted(() => ({ currentUser: vi.fn(), isOwnerUser: vi.fn(), salesEnabled: vi.fn() }));
vi.mock("@/server/viewer", () => ({ currentUser: mocks.currentUser }));
vi.mock("@/server/owner", () => ({ isOwnerUser: mocks.isOwnerUser }));
vi.mock("@/server/payments-deps", () => ({ salesEnabled: mocks.salesEnabled }));
vi.mock("@oracle/content/numerology", async (importOriginal) => (await import("./thread-fixtures")).mockThreadAccepted(importOriginal as never));

// Props клиентского компонента попадают в разметку как поток RSC только при рендере сервером, поэтому смотрим на элемент, а не на HTML
async function offerProp() {
  const tree = (await Page()) as { props: { children: unknown } };
  const found: unknown[] = [];
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== "object") return;
    const element = node as { props?: Record<string, unknown> };
    if (element.props && "texts" in element.props) found.push(element.props.offer);
    if (element.props) walk(element.props.children);
  };
  walk(tree.props.children);
  return found[0];
}

beforeEach(() => {
  mocks.currentUser.mockResolvedValue(null);
  mocks.isOwnerUser.mockResolvedValue(false);
  mocks.salesEnabled.mockReturnValue(false);
});

test("no offer prop while the sale is off", async () => {
  expect(await offerProp()).toBeUndefined();
  expect(mocks.isOwnerUser).not.toHaveBeenCalled();
});

test("a guest with the sale on gets the guest offer, and the sale is asked for the thread product", async () => {
  mocks.salesEnabled.mockReturnValue(true);
  expect(await offerProp()).toEqual({ signedIn: false, owner: false });
  expect(mocks.salesEnabled).toHaveBeenCalledWith(THREAD_REPORT_PRODUCT);
});

test("a signed-in person and the owner are told apart", async () => {
  mocks.salesEnabled.mockReturnValue(true);
  mocks.currentUser.mockResolvedValue({ id: "11111111-1111-4111-8111-111111111111" });
  expect(await offerProp()).toEqual({ signedIn: true, owner: false });
  mocks.isOwnerUser.mockResolvedValue(true);
  expect(await offerProp()).toEqual({ signedIn: true, owner: true });
});

test("the page still renders to markup", async () => {
  mocks.salesEnabled.mockReturnValue(true);
  expect(renderToStaticMarkup((await Page()) as never)).toContain("thread-page");
});
