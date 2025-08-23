import Ordine from '../models/Ordine.js';

export const getStatistiche = async (req, res) => {
  try {
    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);

    const [ordiniOggi, ordiniInLavorazione, statisticheVendite] = await Promise.all([
      // Conta ordini di oggi
      Ordine.countDocuments({
        dataRitiro: {
          $gte: oggi,
          $lt: new Date(oggi.getTime() + 24 * 60 * 60 * 1000)
        }
      }),
      
      // Ordini in lavorazione
      Ordine.countDocuments({ stato: 'in_lavorazione' }),
      
      // Valore totale ordini oggi
      Ordine.aggregate([
        {
          $match: {
            dataRitiro: {
              $gte: oggi,
              $lt: new Date(oggi.getTime() + 24 * 60 * 60 * 1000)
            }
          }
        },
        {
          $group: {
            _id: null,
            valoreOggi: { $sum: '$totale' },
            numeroOrdini: { $sum: 1 }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        ordiniOggi,
        ordiniInLavorazione,
        valoreOggi: statisticheVendite[0]?.valoreOggi || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getProdottiPiuVenduti = async (req, res) => {
  try {
    const risultati = await Ordine.aggregate([
      { $unwind: '$prodotti' },
      {
        $group: {
          _id: '$prodotti.prodotto',
          quantitaTotale: { $sum: '$prodotti.quantita' },
          valoreTotale: { $sum: { $multiply: ['$prodotti.quantita', '$prodotti.prezzo'] } }
        }
      },
      { $sort: { quantitaTotale: -1 } },
      { $limit: 5 }
    ]);

    res.json({ success: true, data: risultati });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

