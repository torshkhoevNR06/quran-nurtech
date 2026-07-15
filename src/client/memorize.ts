import { $$, K, LS, toast } from './shared';

export interface MemorizeState {
  memorize: boolean;
  memRep: number;
  memCount: number;
}

export function initMemorize(player: MemorizeState) {
  const applyMem = () => {
    $$('[data-memorize]').forEach((b) => b.classList.toggle('on', player.memorize));
    $$('[data-memrep]').forEach((b) =>
      b.classList.toggle('on', +b.getAttribute('data-memrep')! === player.memRep)
    );
    document.body.classList.toggle('memorize-on', player.memorize);
  };

  $$('[data-memorize]').forEach((b) =>
    b.addEventListener('click', () => {
      player.memorize = !player.memorize;
      player.memCount = 0;
      LS.set(K.memorize, player.memorize);
      applyMem();
      toast(player.memorize ? 'Заучивание вкл: перевод скрыт, аят повторяется' : 'Заучивание выкл');
    })
  );

  $$('[data-memrep]').forEach((b) =>
    b.addEventListener('click', () => {
      player.memRep = +b.getAttribute('data-memrep')!;
      player.memCount = 0;
      LS.set(K.memrep, player.memRep);
      applyMem();
    })
  );

  applyMem();
}
