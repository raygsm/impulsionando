import { describe, it, expect } from "vitest";
import { validateOfficialChannelMessage } from "@/lib/whatsapp-cta";

const ERR_PHONE = /outro número de telefone/i;
const ERR_EMAIL = /e-mail de terceiros/i;
const ERR_SOCIAL = /canais alternativos/i;
const ERR_WPP = /único WhatsApp aceito/i;

describe("validateOfficialChannelMessage", () => {
  describe("passa mensagens limpas", () => {
    it("texto simples sem contatos", () => {
      expect(validateOfficialChannelMessage("Olá, quero contratar o plano Pro.")).toBeNull();
    });
    it("menção ao próprio WhatsApp oficial", () => {
      expect(
        validateOfficialChannelMessage("Já falei pelo WhatsApp (21) 99307-5000."),
      ).toBeNull();
      expect(
        validateOfficialChannelMessage("https://wa.me/5521993075000"),
      ).toBeNull();
    });
    it("e-mail do domínio oficial", () => {
      expect(
        validateOfficialChannelMessage("Pode responder em joao@impulsionando.com.br"),
      ).toBeNull();
    });
  });

  describe("bloqueio por telefone alternativo", () => {
    it.each([
      "Me liga em (11) 91234-5678",
      "Meu fixo é 21 3333-4444",
      "WhatsApp +55 11 98888-7777",
      "Tel: 11987654321",
    ])("rejeita %s", (msg) => {
      const r = validateOfficialChannelMessage(msg);
      expect(r).toMatch(ERR_PHONE);
    });
  });

  describe("bloqueio por e-mail de terceiros", () => {
    it.each([
      "contato@gmail.com",
      "Envio para vendas@empresa.com.br",
      "test.user+spam@outlook.com",
    ])("rejeita %s", (msg) => {
      expect(validateOfficialChannelMessage(msg)).toMatch(ERR_EMAIL);
    });
  });

  describe("bloqueio por redes sociais / mensageiros", () => {
    it.each([
      "Me chama no Telegram",
      "https://t.me/usuario",
      "DM no instagram.com/perfil",
      "facebook.com/pagina",
      "tiktok.com/@perfil",
      "discord.gg/abcd",
      "Linkedin.com/in/fulano",
    ])("rejeita %s", (msg) => {
      expect(validateOfficialChannelMessage(msg)).toMatch(ERR_SOCIAL);
    });
  });

  describe("bloqueio por WhatsApp alternativo", () => {
    it.each([
      "Use meu WhatsApp pessoal",
      "https://wa.me/5511999999999",
      "WhatsApp da assistente",
    ])("rejeita %s", (msg) => {
      const r = validateOfficialChannelMessage(msg);
      // pode cair em telefone OU em wpp dependendo do conteúdo, mas precisa rejeitar
      expect(r).not.toBeNull();
      expect(r).toMatch(/WhatsApp|telefone/i);
    });
  });

  describe("ordem e consistência das mensagens", () => {
    it("telefone tem prioridade sobre social quando ambos presentes", () => {
      const r = validateOfficialChannelMessage("11999998888 e instagram.com/x");
      expect(r).toMatch(ERR_PHONE);
    });
    it("toda mensagem de erro cita o número oficial", () => {
      const samples = [
        "11999998888",
        "x@gmail.com",
        "instagram.com/p",
        "wa.me/5511999999999",
      ];
      for (const s of samples) {
        const r = validateOfficialChannelMessage(s);
        expect(r).not.toBeNull();
        expect(r!).toMatch(/99307-5000|impulsionando\.com\.br/i);
      }
    });
    it("não rejeita números curtos (CEP, valores)", () => {
      expect(validateOfficialChannelMessage("CEP 20000-000, valor R$ 1.234")).toBeNull();
    });
  });

  it("inclui mensagem específica de WhatsApp quando apenas wa.me alternativo", () => {
    const r = validateOfficialChannelMessage("whatsapp comercial alternativo");
    expect(r).toMatch(ERR_WPP);
  });
});
